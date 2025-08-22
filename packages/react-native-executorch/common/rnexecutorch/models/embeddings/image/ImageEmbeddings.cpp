#include "ImageEmbeddings.h"

#include <executorch/extension/tensor/tensor.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/data_processing/Numerical.h>

namespace rnexecutorch::models::embeddings {

ImageEmbeddings::ImageEmbeddings(
    const std::string &modelSource,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseEmbeddings(modelSource, callInvoker) {
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
      image_processing::readImageToTensor(imageSource, getAllInputShapes()[0]);

  auto forwardResult = BaseModel::forward(inputTensor);
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Function forward in ImageEmbeddings failed with error code: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }

  return BaseEmbeddings::postprocess(forwardResult);
}

} // namespace rnexecutorch::models::embeddings
