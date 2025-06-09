#include "StyleTransfer.h"

#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>

#include <span>

#include <executorch/extension/tensor/tensor.h>
#include <opencv2/opencv.hpp>

namespace rnexecutorch {
using namespace facebook;
using executorch::extension::TensorPtr;
using executorch::runtime::Error;

StyleTransfer::StyleTransfer(const std::string &modelSource,
                             std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  auto inputShapes = getInputShape();
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
}

std::string StyleTransfer::postprocess(const Tensor &tensor,
                                       cv::Size originalSize) {
  cv::Mat mat = imageprocessing::getMatrixFromTensor(modelImageSize, tensor);
  cv::resize(mat, mat, originalSize);

  return imageprocessing::saveToTempFile(mat);
}

std::string StyleTransfer::forward(std::string imageSource) {
  auto [inputTensor, originalSize] =
      imageprocessing::readImageToTensor(imageSource, getInputShape()[0]);

  auto forwardResult = forwardET(inputTensor);
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Failed to forward, error: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }

  return postprocess(forwardResult->at(0).toTensor(), originalSize);
}

} // namespace rnexecutorch