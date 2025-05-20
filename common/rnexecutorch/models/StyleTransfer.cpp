#include "StyleTransfer.h"

#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>

#include <span>

#include <executorch/extension/tensor/tensor.h>
#include <opencv2/opencv.hpp>

namespace rnexecutorch {
using namespace facebook;
using executorch::extension::Module;
using executorch::extension::TensorPtr;
using executorch::runtime::Error;

StyleTransfer::StyleTransfer(const std::string &modelSource,
                             jsi::Runtime *runtime)
    : BaseModel(modelSource, runtime) {
  std::vector<int32_t> modelInputShape = getInputShape()[0];
  modelImageSize = cv::Size(modelInputShape[modelInputShape.size() - 1],
                            modelInputShape[modelInputShape.size() - 2]);
}

std::pair<TensorPtr, cv::Size>
StyleTransfer::preprocess(const std::string &imageSource) {
  cv::Mat image = imageprocessing::readImage(imageSource);
  auto originalSize = image.size();
  cv::resize(image, image, modelImageSize);

  return {imageprocessing::getTensorFromMatrix(getInputShape()[0], image),
          originalSize};
}

std::string StyleTransfer::postprocess(const Tensor &tensor,
                                       cv::Size originalSize) {
  cv::Mat mat = imageprocessing::getMatrixFromTensor(modelImageSize, tensor);
  cv::resize(mat, mat, originalSize);

  return imageprocessing::saveToTempFile(mat);
}

std::string StyleTransfer::forward(std::string imageSource) {
  auto [tensor, originalSize] = preprocess(imageSource);

  auto forwardResult = module->forward(tensor);
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Failed to forward, error: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }

  return postprocess(forwardResult->at(0).toTensor(), originalSize);
}

} // namespace rnexecutorch