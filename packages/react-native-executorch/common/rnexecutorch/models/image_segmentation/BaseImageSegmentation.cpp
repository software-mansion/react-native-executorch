#include "BaseImageSegmentation.h"
#include "jsi/jsi.h"

#include <future>

#include <executorch/extension/tensor/tensor.h>
#include <rnexecutorch/Error.h>
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
  if (inputShapes.empty()) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "Model seems to not take any input tensors.");
  }
  std::vector<int32_t> modelInputShape = inputShapes[0];
  if (modelInputShape.size() < 2) {
    throw RnExecutorchError(RnExecutorchErrorCode::WrongDimensions,
                            "Unexpected model input size, expected at least 2 "
                            "dimensions but got: " +
                                std::to_string(modelInputShape.size()) + ".");
  }
  modelImageSize = cv::Size(modelInputShape[modelInputShape.size() - 1],
                            modelInputShape[modelInputShape.size() - 2]);
  numModelPixels = modelImageSize.area();
}

TensorPtr BaseImageSegmentation::preprocess(const std::string &imageSource,
                                            cv::Size &originalSize) {
  auto [inputTensor, origSize] = image_processing::readImageToTensor(
      imageSource, getAllInputShapes()[0], false, normMean_, normStd_);
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
    std::vector<std::string> &allClasses,
    std::set<std::string, std::less<>> &classesOfInterest, bool resize) {

  const auto *dataPtr = tensor.const_data_ptr<float>();
  auto resultData = std::span(dataPtr, tensor.numel());

  // Read output dimensions directly from tensor shape
  std::size_t numChannels =
      (tensor.dim() >= 3) ? tensor.size(tensor.dim() - 3) : 1;
  std::size_t outputH = tensor.size(tensor.dim() - 2);
  std::size_t outputW = tensor.size(tensor.dim() - 1);
  std::size_t outputPixels = outputH * outputW;
  cv::Size outputSize(outputW, outputH);

  // Work with vectors, only wrap into OwningArrayBuffer at the end
  std::vector<std::vector<float>> classBuffers;
  std::vector<int32_t> argmaxData(outputPixels);

  if (numChannels == 1) {
    // Binary segmentation (e.g. selfie segmentation)
    std::vector<float> bg(outputPixels);
    std::vector<float> fg(outputPixels);
    for (std::size_t pixel = 0; pixel < outputPixels; ++pixel) {
      float p = resultData[pixel];
      bg[pixel] = 1.0f - p;
      fg[pixel] = p;
      argmaxData[pixel] = (p > 0.5f) ? 1 : 0;
    }
    classBuffers = {std::move(bg), std::move(fg)};
  } else {
    // Multi-class segmentation (e.g. DeepLab, RF-DETR)
    classBuffers.resize(numChannels);
    for (std::size_t cl = 0; cl < numChannels; ++cl) {
      classBuffers[cl].assign(resultData.data() + cl * outputPixels,
                              resultData.data() + (cl + 1) * outputPixels);
    }

    // Apply softmax and compute argmax per pixel
    for (std::size_t pixel = 0; pixel < outputPixels; ++pixel) {
      std::vector<float> values(numChannels);
      for (std::size_t cl = 0; cl < numChannels; ++cl) {
        values[cl] = classBuffers[cl][pixel];
      }
      numerical::softmax(values);

      float maxVal = values[0];
      int maxInd = 0;
      for (std::size_t cl = 0; cl < numChannels; ++cl) {
        classBuffers[cl][pixel] = values[cl];
        if (values[cl] > maxVal) {
          maxVal = values[cl];
          maxInd = static_cast<int>(cl);
        }
      }
      argmaxData[pixel] = maxInd;
    }
  }

  // Wrap into OwningArrayBuffers
  auto argmax = std::make_shared<OwningArrayBuffer>(argmaxData);
  std::vector<std::shared_ptr<OwningArrayBuffer>> resultClasses;
  resultClasses.reserve(classBuffers.size());
  for (auto &buf : classBuffers) {
    resultClasses.push_back(std::make_shared<OwningArrayBuffer>(buf));
  }

  // Filter classes of interest
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
