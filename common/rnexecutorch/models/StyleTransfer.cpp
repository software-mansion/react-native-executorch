#include "StyleTransfer.h"

#include <span>

#include <executorch/extension/tensor/tensor.h>
#include <opencv2/opencv.hpp>

#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>

namespace rnexecutorch {
using namespace facebook;
using ::executorch::extension::Module;
using ::executorch::runtime::Error;

StyleTransfer::StyleTransfer(const std::string &modelSource,
                             jsi::Runtime *runtime)
    : BaseModel(modelSource, runtime) {}

std::string StyleTransfer::forward(std::string imageSource) {
  cv::Mat input = imageprocessing::readImage(imageSource);

  auto originalSize = input.size();

  std::vector<int32_t> modelInputShape = getInputShape();
  cv::Size modelImageSize =
      cv::Size(modelInputShape[modelInputShape.size() - 1],
               modelInputShape[modelInputShape.size() - 2]);

  cv::Mat resizedInput;
  cv::resize(input, resizedInput, modelImageSize);

  std::vector<float> inputVector =
      imageprocessing::colorMatToVector(resizedInput);
  auto tensor =
      executorch::extension::make_tensor_ptr(modelInputShape, inputVector);

  auto forwardResult = module->forward(tensor);
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Failed to forward, error: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }

  auto resultTensor = forwardResult->at(0).toTensor();
  auto resultData = static_cast<const float *>(resultTensor.const_data_ptr());

  cv::Mat modelOutputMat{imageprocessing::bufferToColorMat(
      std::span<const float>(resultData, resultTensor.numel()),
      modelImageSize)};

  cv::Mat resizedOutput;
  cv::resize(modelOutputMat, resizedOutput, originalSize);

  return imageprocessing::saveToTempFile(resizedOutput);
}

} // namespace rnexecutorch