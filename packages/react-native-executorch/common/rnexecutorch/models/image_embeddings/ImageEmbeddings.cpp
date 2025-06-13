#include "ImageEmbeddings.h"

#include <executorch/extension/tensor/tensor.h>
#include <rnexecutorch/Log.h>
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

JSTensorViewOut ImageEmbeddings::generate(std::string imageSource) {
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
  auto sizesRaw = outputTensor.sizes();
  auto sizes = std::vector<int32_t>(sizesRaw.begin(), sizesRaw.end());
  size_t bufferSize = outputTensor.numel() * outputTensor.element_size();
  auto buffer = std::make_shared<OwningArrayBuffer>(bufferSize);

  std::span<const float> outputTensorSpan(
      static_cast<const float *>(outputTensor.const_data_ptr()),
      outputTensor.numel());
  std::vector<float> outputVector(outputTensorSpan.begin(),
                                  outputTensorSpan.end());

  numerical::normalizeVector(outputVector);

  std::memcpy(buffer->data(), outputVector.data(), bufferSize);

  auto jsTensor = JSTensorViewOut(sizes, outputTensor.scalar_type(), buffer);

  return jsTensor;
}
} // namespace rnexecutorch
