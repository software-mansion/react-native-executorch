#include "ImageSegmentation.h"

#include <executorch/extension/tensor/tensor.h>

#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/data_processing/Numerical.h>
#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/models/image_segmentation/Constants.h>

namespace rnexecutorch {

ImageSegmentation::ImageSegmentation(const std::string &modelSource,
                                     jsi::Runtime *runtime)
    : BaseModel(modelSource, runtime) {

  std::vector<int32_t> modelInputShape = getInputShape();
  modelImageSize = cv::Size(modelInputShape[modelInputShape.size() - 1],
                            modelInputShape[modelInputShape.size() - 2]);
  numModelPixels = modelImageSize.area();
}

jsi::Value
ImageSegmentation::forward(std::string imageSource,
                           std::set<std::string, std::less<>> classesOfInterest,
                           bool resize) {
  auto [inputTensor, originalSize] = preprocess(imageSource);

  auto forwardResult = module->forward(inputTensor);
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Failed to forward, error: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }

  return postprocess(forwardResult->at(0).toTensor(), originalSize,
                     classesOfInterest, resize);
}

jsi::Value ImageSegmentation::postprocess(
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
    resultClasses.emplace_back(classBuffer);
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

  std::unordered_map<std::string_view, std::shared_ptr<OwningArrayBuffer>>
      buffersToReturn;
  for (std::size_t cl = 0; cl < numClasses; ++cl) {
    if (classesOfInterest.contains(deeplabv3_resnet50_labels[cl])) {
      buffersToReturn[deeplabv3_resnet50_labels[cl]] = resultClasses[cl];
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

    for (auto &[label, arrayBuffer] : buffersToReturn) {
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

jsi::Value ImageSegmentation::populateDictionary(
    std::shared_ptr<OwningArrayBuffer> argmax,
    std::unordered_map<std::string_view, std::shared_ptr<OwningArrayBuffer>>
        classesToOutput) {
  jsi::Object dict(*runtime);

  auto argmaxArrayBuffer = jsi::ArrayBuffer(*runtime, argmax);

  auto int32ArrayCtor =
      runtime->global().getPropertyAsFunction(*runtime, "Int32Array");
  auto int32Array =
      int32ArrayCtor.callAsConstructor(*runtime, argmaxArrayBuffer)
          .getObject(*runtime);
  dict.setProperty(*runtime, "ARGMAX", int32Array);

  std::size_t dictIndex = 1;
  for (auto &[classLabel, owningBuffer] : classesToOutput) {
    auto classArrayBuffer = jsi::ArrayBuffer(*runtime, owningBuffer);

    auto float32ArrayCtor =
        runtime->global().getPropertyAsFunction(*runtime, "Float32Array");
    auto float32Array =
        float32ArrayCtor.callAsConstructor(*runtime, classArrayBuffer)
            .getObject(*runtime);

    dict.setProperty(*runtime,
                     jsi::String::createFromAscii(*runtime, classLabel.data()),
                     float32Array);
  }
  return dict;
}

std::pair<TensorPtr, cv::Size>
ImageSegmentation::preprocess(const std::string &imageSource) {
  cv::Mat input = imageprocessing::readImage(imageSource);
  cv::Size inputSize = input.size();

  std::vector<int32_t> modelInputShape = getInputShape();
  cv::Size modelImageSize =
      cv::Size(modelInputShape[modelInputShape.size() - 1],
               modelInputShape[modelInputShape.size() - 2]);

  cv::resize(input, input, modelImageSize);

  std::vector<float> inputVector = imageprocessing::colorMatToVector(input);
  return {executorch::extension::make_tensor_ptr(modelInputShape, inputVector),
          inputSize};
}

} // namespace rnexecutorch