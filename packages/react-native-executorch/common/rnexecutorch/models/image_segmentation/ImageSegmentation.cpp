#include "ImageSegmentation.h"

#include <future>

#include <executorch/extension/tensor/tensor.h>

#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/data_processing/Numerical.h>
#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/models/image_segmentation/Constants.h>

namespace rnexecutorch::models::image_segmentation {

ImageSegmentation::ImageSegmentation(
    const std::string &modelSource,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  auto inputShapes = getAllInputShapes();
  if (inputShapes.size() == 0) {
    throw std::runtime_error("Model seems to not take any input tensors.");
  }
  std::vector<int32_t> modelInputShape = inputShapes[0];
  if (modelInputShape.size() < 2) {
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Unexpected model input size, expected at least 2 dimentions "
                  "but got: %zu.",
                  modelInputShape.size());
    throw std::runtime_error(errorMessage);
  }
  modelImageSize = cv::Size(modelInputShape[modelInputShape.size() - 1],
                            modelInputShape[modelInputShape.size() - 2]);
  numModelPixels = modelImageSize.area();
}

std::shared_ptr<jsi::Object> ImageSegmentation::generate(
    std::string imageSource,
    std::set<std::string, std::less<>> classesOfInterest, bool resize) {
  auto [inputTensor, originalSize] =
      image_processing::readImageToTensor(imageSource, getAllInputShapes()[0]);

  auto forwardResult = BaseModel::forward(inputTensor);
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Failed to forward, error: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }

  return postprocess(forwardResult->at(0).toTensor(), originalSize,
                     classesOfInterest, resize);
}

std::shared_ptr<jsi::Object> ImageSegmentation::postprocess(
    const Tensor &tensor, cv::Size originalSize,
    std::set<std::string, std::less<>> classesOfInterest, bool resize) {

  auto dataPtr = static_cast<const float *>(tensor.const_data_ptr());
  auto resultData = std::span(dataPtr, tensor.numel());

  // We copy the ET-owned data to jsi array buffers that can be directly
  // returned to JS
  std::vector<std::shared_ptr<OwningArrayBuffer>> resultClasses;
  resultClasses.reserve(numClasses);
  for (std::size_t cl = 0; cl < numClasses; ++cl) {
    auto classBuffer =
        std::make_shared<OwningArrayBuffer>(numModelPixels * sizeof(float));
    resultClasses.push_back(classBuffer);
    std::memcpy(classBuffer->data(), &resultData[cl * numModelPixels],
                numModelPixels * sizeof(float));
  }

  // Apply softmax per each pixel across all classes
  for (std::size_t pixel = 0; pixel < numModelPixels; ++pixel) {
    std::vector<float> classValues(numClasses);
    for (std::size_t cl = 0; cl < numClasses; ++cl) {
      classValues[cl] =
          reinterpret_cast<float *>(resultClasses[cl]->data())[pixel];
    }
    numerical::softmax(classValues);
    for (std::size_t cl = 0; cl < numClasses; ++cl) {
      reinterpret_cast<float *>(resultClasses[cl]->data())[pixel] =
          classValues[cl];
    }
  }

  // Calculate the maximum class for each pixel
  auto argmax =
      std::make_shared<OwningArrayBuffer>(numModelPixels * sizeof(int32_t));
  for (std::size_t pixel = 0; pixel < numModelPixels; ++pixel) {
    float max = reinterpret_cast<float *>(resultClasses[0]->data())[pixel];
    int maxInd = 0;
    for (int cl = 1; cl < numClasses; ++cl) {
      if (reinterpret_cast<float *>(resultClasses[cl]->data())[pixel] > max) {
        maxInd = cl;
        max = reinterpret_cast<float *>(resultClasses[cl]->data())[pixel];
      }
    }
    reinterpret_cast<int32_t *>(argmax->data())[pixel] = maxInd;
  }

  auto buffersToReturn = std::make_shared<std::unordered_map<
      std::string_view, std::shared_ptr<OwningArrayBuffer>>>();
  for (std::size_t cl = 0; cl < numClasses; ++cl) {
    if (classesOfInterest.contains(constants::kDeeplabV3Resnet50Labels[cl])) {
      (*buffersToReturn)[constants::kDeeplabV3Resnet50Labels[cl]] =
          resultClasses[cl];
    }
  }

  // Resize selected classes and argmax
  if (resize) {
    cv::Mat argmaxMat(modelImageSize, CV_32SC1, argmax->data());
    cv::resize(argmaxMat, argmaxMat, originalSize, 0, 0,
               cv::InterpolationFlags::INTER_NEAREST);
    argmax = std::make_shared<OwningArrayBuffer>(originalSize.area() *
                                                 sizeof(int32_t));
    std::memcpy(argmax->data(), argmaxMat.data,
                originalSize.area() * sizeof(int32_t));

    for (auto &[label, arrayBuffer] : *buffersToReturn) {
      cv::Mat classMat(modelImageSize, CV_32FC1, arrayBuffer->data());
      cv::resize(classMat, classMat, originalSize);
      arrayBuffer = std::make_shared<OwningArrayBuffer>(originalSize.area() *
                                                        sizeof(float));
      std::memcpy(arrayBuffer->data(), classMat.data,
                  originalSize.area() * sizeof(float));
    }
  }
  return populateDictionary(argmax, buffersToReturn);
}

std::shared_ptr<jsi::Object> ImageSegmentation::populateDictionary(
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