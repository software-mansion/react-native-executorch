#include "VerticalDetector.h"

#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/ocr/Constants.h>
#include <rnexecutorch/models/ocr/utils/DetectorUtils.h>

#include <executorch/extension/tensor/tensor_ptr.h>
#include <string>

namespace rnexecutorch::models::ocr {
VerticalDetector::VerticalDetector(
    const std::string &modelSource,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  this->modelSmallImageSize =
      calculateImageSizeForWidth(constants::kSmallDetectorWidth);
  this->modelMediumImageSize =
      calculateImageSizeForWidth(constants::kMediumDetectorWidth);
  this->modelLargeImageSize =
      calculateImageSizeForWidth(constants::kLargeDetectorWidth);
}

std::vector<types::DetectorBBox>
VerticalDetector::generate(const cv::Mat &inputImage, int32_t inputWidth,
                           bool detectSingleCharacters) {

  std::string methodName = "forward_" + std::to_string(inputWidth);

  auto inputShapes = getAllInputShapes(methodName);

  cv::Mat resizedInputImage =
      image_processing::resizePadded(inputImage, getModelImageSize(inputWidth));
  TensorPtr inputTensor = image_processing::getTensorFromMatrix(
      inputShapes[0], resizedInputImage, constants::kNormalizationMean,
      constants::kNormalizationVariance);
  auto forwardResult = BaseModel::execute(methodName, {inputTensor});
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Failed to forward, error: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }
  return postprocess(forwardResult->at(0).toTensor(),
                     getModelImageSize(inputWidth), detectSingleCharacters);
}

std::vector<types::DetectorBBox>
VerticalDetector::postprocess(const Tensor &tensor,
                              const cv::Size &modelInputSize,
                              bool detectSingleCharacters) const {
  /*
   The output of the model consists of two matrices (heat maps):
   1. ScoreText(Score map) - The probability of a region containing character.
   2. ScoreAffinity(Affinity map) - affinity between characters, used to to
   group each character into a single instance (sequence) Both matrices are
   H/2xW/2.

   The result of this step is a list of bounding boxes that contain text.
   */
  std::span<const float> tensorData(tensor.const_data_ptr<float>(),
                                    tensor.numel());
  /*
   The output of the model is a matrix half the size of the input image
   containing two channels representing the heatmaps.
   */
  auto [scoreTextMat, scoreAffinityMat] = utils::interleavedArrayToMats(
      tensorData,
      cv::Size(modelInputSize.width / 2, modelInputSize.height / 2));
  float txtThreshold = detectSingleCharacters
                           ? constants::kTextThreshold
                           : constants::kTextThresholdVertical;
  std::vector<types::DetectorBBox> bBoxesList =
      utils::getDetBoxesFromTextMapVertical(
          scoreTextMat, scoreAffinityMat, txtThreshold,
          constants::kLinkThreshold, detectSingleCharacters);
  const float restoreRatio = utils::calculateRestoreRatio(
      scoreTextMat.rows, constants::kRecognizerImageSize);
  utils::restoreBboxRatio(bBoxesList, restoreRatio);

  // if this is Narrow Detector, do not group boxes.
  if (!detectSingleCharacters) {
    bBoxesList = utils::groupTextBoxes(
        bBoxesList, constants::kCenterThreshold, constants::kDistanceThreshold,
        constants::kHeightThreshold, constants::kMinSideThreshold,
        constants::kMaxSideThreshold, constants::kMaxWidth);
  }

  return bBoxesList;
}

cv::Size
VerticalDetector::calculateImageSizeForWidth(const int methoInputWidth) {

  std::string methodName = "forward_" + std::to_string(methoInputWidth);

  auto inputShapes = getAllInputShapes(methodName);

  if (inputShapes.empty()) {
    throw std::runtime_error("Detector model has no input shape for method: " +
                             methodName);
  }
  std::vector<int32_t> modelInputShape = inputShapes[0];

  if (modelInputShape.size() < 2) {
    throw std::runtime_error("Unexpected detector model input size, expected "
                             "at least 2 dimensions but got: " +
                             std::to_string(modelInputShape.size()) + ".");
  }

  cv::Size modelInputSize =
      cv::Size(modelInputShape[modelInputShape.size() - 1],
               modelInputShape[modelInputShape.size() - 2]);
  return modelInputSize;
}

cv::Size VerticalDetector::getModelImageSize(int inputWidth) const noexcept {
  switch (inputWidth) {
  case constants::kSmallDetectorWidth:
    return modelSmallImageSize;
    break;
  case constants::kMediumDetectorWidth:
    return modelMediumImageSize;
    break;
  case constants::kLargeDetectorWidth:
    return modelLargeImageSize;
    break;
  default:
    return modelMediumImageSize;
  }
}

} // namespace rnexecutorch::models::ocr
