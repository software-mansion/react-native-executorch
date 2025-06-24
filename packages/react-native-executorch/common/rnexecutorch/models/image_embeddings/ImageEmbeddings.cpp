#include "ImageEmbeddings.h"

#include <executorch/extension/tensor/tensor.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/data_processing/Numerical.h>
namespace rnexecutorch {

ImageEmbeddings::ImageEmbeddings(
    const std::string &modelSource,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  auto inputTensors = getAllInputShapes();
  if (inputTensors.size() == 0) {
    throw std::runtime_error("Model seems to not take any input tensors.");
  }
  std::vector<int32_t> modelInputShape = inputTensors[0];
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
}

std::shared_ptr<OwningArrayBuffer>
ImageEmbeddings::generate(std::string imageSource) {
  auto [inputTensor, originalSize] =
      imageprocessing::readImageToTensor(imageSource, getAllInputShapes()[0]);

  auto result = BaseModel::forward(inputTensor);
  if (!result.ok()) {
    throw std::runtime_error("Forward pass failed: Error " +
                             std::to_string(static_cast<int>(result.error())));
  }

  auto &outputs = result.get();

  if (outputs.size() > 1) {
    throw std::runtime_error("It returned multiple outputs!");
  }

  auto &outputTensor = outputs.at(0).toTensor();
  std::span<float> outputTensorSpan(
      static_cast<float *>(outputTensor.mutable_data_ptr()),
      outputTensor.numel());

  numerical::normalize(outputTensorSpan);

  size_t bufferSize = outputTensorSpan.size_bytes();
  auto buffer = std::make_shared<OwningArrayBuffer>(bufferSize);

  std::memcpy(buffer->data(), outputTensorSpan.data(), bufferSize);

  return buffer;
}
} // namespace rnexecutorch
