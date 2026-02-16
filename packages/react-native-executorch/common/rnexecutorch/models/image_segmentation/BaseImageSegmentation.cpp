#include "BaseImageSegmentation.h"
#include "jsi/jsi.h"

#include <cmath>
#include <future>

#include <executorch/extension/tensor/tensor.h>
#include <memory>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/data_processing/Numerical.h>
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch::models::image_segmentation {

BaseImageSegmentation::BaseImageSegmentation(
    const std::string &modelSource,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  initModelImageSize();
}

BaseImageSegmentation::BaseImageSegmentation(
    const std::string &modelSource, std::vector<float> normMean,
    std::vector<float> normStd, std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  initModelImageSize();
  if (normMean.size() >= 3) {
    normMean_ = cv::Scalar(normMean[0], normMean[1], normMean[2]);
  }
  if (normStd.size() >= 3) {
    normStd_ = cv::Scalar(normStd[0], normStd[1], normStd[2]);
  }
}

void BaseImageSegmentation::initModelImageSize() {
  auto inputShapes = getAllInputShapes();
  if (inputShapes.size() == 0) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "Model seems to not take any input tensors.");
  }
  std::vector<int32_t> modelInputShape = inputShapes[0];
  if (modelInputShape.size() < 2) {
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Unexpected model input size, expected at least 2 dimentions "
                  "but got: %zu.",
                  modelInputShape.size());
    throw RnExecutorchError(RnExecutorchErrorCode::WrongDimensions,
                            errorMessage);
  }
  modelImageSize = cv::Size(modelInputShape[modelInputShape.size() - 1],
                            modelInputShape[modelInputShape.size() - 2]);
  numModelPixels = modelImageSize.area();
}

TensorPtr BaseImageSegmentation::preprocess(const std::string &imageSource,
                                            cv::Size &originalSize) {
  if (normMean_.has_value() && normStd_.has_value()) {
    cv::Mat input = image_processing::readImage(imageSource);
    originalSize = input.size();
    cv::resize(input, input, modelImageSize);
    cv::cvtColor(input, input, cv::COLOR_BGR2RGB);
    return image_processing::getTensorFromMatrix(
        getAllInputShapes()[0], input, normMean_.value(), normStd_.value());
  }
  auto [inputTensor, origSize] =
      image_processing::readImageToTensor(imageSource, getAllInputShapes()[0]);
  originalSize = origSize;
  return inputTensor;
}

std::shared_ptr<jsi::Object> BaseImageSegmentation::generate(
    std::string imageSource, std::vector<std::string> allClasses,
    std::set<std::string, std::less<>> classesOfInterest, bool resize) {

  cv::Size originalSize;
  auto inputTensor = preprocess(imageSource, originalSize);

  auto forwardResult = BaseModel::forward(inputTensor);

  if (!forwardResult.ok()) {
    throw RnExecutorchError(forwardResult.error(),
                            "The model's forward function did not succeed. "
                            "Ensure the model input is correct.");
  }

  return postprocess(forwardResult->at(0).toTensor(), originalSize, allClasses,
                     classesOfInterest, resize);
}

std::shared_ptr<jsi::Object> BaseImageSegmentation::postprocess(
    const Tensor &tensor, cv::Size originalSize,
    std::vector<std::string> allClasses,
    std::set<std::string, std::less<>> classesOfInterest, bool resize) {

  auto dataPtr = static_cast<const float *>(tensor.const_data_ptr());
  auto resultData = std::span(dataPtr, tensor.numel());

  // Infer output pixel count and channel count.
  // If output spatial dims differ from input (e.g. model downsamples),
  // derive pixel count from the tensor and allClasses.size().
  size_t numOutputChannels = tensor.numel() / numModelPixels;
  size_t outputPixels = numModelPixels;
  if (numOutputChannels != 1 && numOutputChannels != allClasses.size() &&
      !allClasses.empty() && tensor.numel() % allClasses.size() == 0) {
    outputPixels = tensor.numel() / allClasses.size();
    numOutputChannels = allClasses.size();
  }
  auto outputSide = static_cast<int>(std::sqrt(outputPixels));
  cv::Size outputSize(outputSide, outputSide);

  std::vector<std::shared_ptr<OwningArrayBuffer>> resultClasses;
  auto argmax =
      std::make_shared<OwningArrayBuffer>(outputPixels * sizeof(int32_t));

  if (numOutputChannels == 1) {
    // Binary segmentation path (e.g. selfie segmentation)
    // The single channel contains probability values in [0, 1]
    // Synthesize two class buffers: background (1-p) and foreground (p)
    resultClasses.reserve(2);

    auto bgBuffer =
        std::make_shared<OwningArrayBuffer>(outputPixels * sizeof(float));
    auto fgBuffer =
        std::make_shared<OwningArrayBuffer>(outputPixels * sizeof(float));

    auto *bgData = reinterpret_cast<float *>(bgBuffer->data());
    auto *fgData = reinterpret_cast<float *>(fgBuffer->data());
    auto *argmaxData = reinterpret_cast<int32_t *>(argmax->data());

    for (std::size_t pixel = 0; pixel < outputPixels; ++pixel) {
      float p = resultData[pixel];
      bgData[pixel] = 1.0f - p;
      fgData[pixel] = p;
      argmaxData[pixel] = (p > 0.5f) ? 1 : 0;
    }

    resultClasses.push_back(bgBuffer);
    resultClasses.push_back(fgBuffer);
  } else if (numOutputChannels == allClasses.size()) {
    // Multi-class segmentation path (e.g. DeepLab-v3)
    // Copy per-class buffers from the ET-owned tensor data
    resultClasses.reserve(allClasses.size());
    for (std::size_t cl = 0; cl < allClasses.size(); ++cl) {
      auto classBuffer = std::make_shared<OwningArrayBuffer>(
          &resultData[cl * outputPixels], outputPixels * sizeof(float));
      resultClasses.push_back(classBuffer);
    }

    // Apply softmax per each pixel across all classes
    for (std::size_t pixel = 0; pixel < outputPixels; ++pixel) {
      std::vector<float> classValues(allClasses.size());
      for (std::size_t cl = 0; cl < allClasses.size(); ++cl) {
        classValues[cl] =
            reinterpret_cast<float *>(resultClasses[cl]->data())[pixel];
      }
      numerical::softmax(classValues);
      for (std::size_t cl = 0; cl < allClasses.size(); ++cl) {
        reinterpret_cast<float *>(resultClasses[cl]->data())[pixel] =
            classValues[cl];
      }
    }

    // Calculate the maximum class for each pixel
    auto *argmaxData = reinterpret_cast<int32_t *>(argmax->data());
    for (std::size_t pixel = 0; pixel < outputPixels; ++pixel) {
      float max = reinterpret_cast<float *>(resultClasses[0]->data())[pixel];
      int maxInd = 0;
      for (std::size_t cl = 1; cl < allClasses.size(); ++cl) {
        if (reinterpret_cast<float *>(resultClasses[cl]->data())[pixel] > max) {
          maxInd = static_cast<int>(cl);
          max = reinterpret_cast<float *>(resultClasses[cl]->data())[pixel];
        }
      }
      argmaxData[pixel] = maxInd;
    }
  } else {
    char errorMessage[200];
    std::snprintf(
        errorMessage, sizeof(errorMessage),
        "Unexpected number of output channels: %zu. Expected 1 (binary) or "
        "%zu (matching allClasses). Model output has %zu elements for %zu "
        "pixels.",
        numOutputChannels, allClasses.size(), tensor.numel(), outputPixels);
    throw RnExecutorchError(RnExecutorchErrorCode::WrongDimensions,
                            errorMessage);
  }

  // Filter classes of interest using allClasses labels
  auto buffersToReturn = std::make_shared<std::unordered_map<
      std::string_view, std::shared_ptr<OwningArrayBuffer>>>();
  for (std::size_t cl = 0; cl < resultClasses.size(); ++cl) {
    if (cl < allClasses.size() && classesOfInterest.contains(allClasses[cl])) {
      (*buffersToReturn)[allClasses[cl]] = resultClasses[cl];
    }
  }

  // Resize selected classes and argmax
  if (resize) {
    cv::Mat argmaxMat(outputSize, CV_32SC1, argmax->data());
    cv::resize(argmaxMat, argmaxMat, originalSize, 0, 0,
               cv::InterpolationFlags::INTER_NEAREST);
    argmax = std::make_shared<OwningArrayBuffer>(
        argmaxMat.data, originalSize.area() * sizeof(int32_t));

    for (auto &[label, arrayBuffer] : *buffersToReturn) {
      cv::Mat classMat(outputSize, CV_32FC1, arrayBuffer->data());
      cv::resize(classMat, classMat, originalSize);
      arrayBuffer = std::make_shared<OwningArrayBuffer>(
          classMat.data, originalSize.area() * sizeof(float));
    }
  }
  return populateDictionary(argmax, buffersToReturn);
}

std::shared_ptr<jsi::Object> BaseImageSegmentation::populateDictionary(
    std::shared_ptr<OwningArrayBuffer> argmax,
    std::shared_ptr<std::unordered_map<std::string_view,
                                       std::shared_ptr<OwningArrayBuffer>>>
        classesToOutput) {
  // Synchronize the invoked thread to return when the dict is constructed
  auto promisePtr = std::make_shared<std::promise<void>>();
  std::future<void> doneFuture = promisePtr->get_future();

  std::shared_ptr<jsi::Object> dictPtr = nullptr;
  callInvoker->invokeAsync(
      [argmax, classesToOutput, &dictPtr, promisePtr](jsi::Runtime &runtime) {
        dictPtr = std::make_shared<jsi::Object>(runtime);
        auto argmaxArrayBuffer = jsi::ArrayBuffer(runtime, argmax);

        auto int32ArrayCtor =
            runtime.global().getPropertyAsFunction(runtime, "Int32Array");
        auto int32Array =
            int32ArrayCtor.callAsConstructor(runtime, argmaxArrayBuffer)
                .getObject(runtime);
        dictPtr->setProperty(runtime, "ARGMAX", int32Array);

        for (auto &[classLabel, owningBuffer] : *classesToOutput) {
          auto classArrayBuffer = jsi::ArrayBuffer(runtime, owningBuffer);

          auto float32ArrayCtor =
              runtime.global().getPropertyAsFunction(runtime, "Float32Array");
          auto float32Array =
              float32ArrayCtor.callAsConstructor(runtime, classArrayBuffer)
                  .getObject(runtime);

          dictPtr->setProperty(
              runtime, jsi::String::createFromAscii(runtime, classLabel.data()),
              float32Array);
        }
        promisePtr->set_value();
      });

  doneFuture.wait();
  return dictPtr;
}

} // namespace rnexecutorch::models::image_segmentation
