#include "StyleTransfer.h"

#include <rnexecutorch/data_processing/ImageProcessing.h>

#include <executorch/extension/tensor/tensor.h>
#include <opencv2/opencv.hpp>

#include "../../Log.h"

namespace rnexecutorch {
using namespace facebook;
using executorch::extension::TensorPtr;
using executorch::runtime::Error;

StyleTransfer::StyleTransfer(const std::string &modelSource,
                             std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  auto inputShapes = getAllInputShapes();
  auto myVector2 = std::pair<std::vector<int>, std::vector<int>>{
      std::vector<int>{1, 2, 3}, std::vector<int>{4, 5}};
  // auto myMap = std::map<int, std::pair<int, float>>{{1, {1, 2}}, {2, {3,
  // 4}}}; auto myTuple = std::make_tuple(1, 2.5, "hello", 'a'); auto myVector =
  // std::vector<std::vector<int>>(1000, std::vector<int>(3, 7));
  log(LOG_LEVEL::Info, "Test tuple: ", myVector2);
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

std::string StyleTransfer::generate(std::string imageSource) {
  auto [inputTensor, originalSize] =
      imageprocessing::readImageToTensor(imageSource, getAllInputShapes()[0]);

  auto forwardResult = BaseModel::forward(inputTensor);
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Failed to forward, error: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }

  return postprocess(forwardResult->at(0).toTensor(), originalSize);
}

} // namespace rnexecutorch