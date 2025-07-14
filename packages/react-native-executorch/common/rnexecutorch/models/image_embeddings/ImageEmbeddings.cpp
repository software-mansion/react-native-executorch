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

  auto forwardResult = BaseModel::forward(inputTensor);
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Failed to forward, error: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }

  auto forwardResultTensor = forwardResult->at(0).toTensor();
  auto dataPtr = forwardResultTensor.mutable_data_ptr();
  auto outputNumel = forwardResultTensor.numel();

  std::span<float> modelOutputSpan(static_cast<float *>(dataPtr), outputNumel);

  return postprocess(modelOutputSpan);
}

std::shared_ptr<OwningArrayBuffer>
ImageEmbeddings::postprocess(std::span<float> modelOutput) {
  auto createBuffer = [](const auto &data, size_t size) {
    auto buffer = std::make_shared<OwningArrayBuffer>(size);
    std::memcpy(buffer->data(), data, size);
    return buffer;
  };

  return createBuffer(modelOutput.data(), modelOutput.size_bytes());
}

} // namespace rnexecutorch
