#include "VerticalDetector.h"

#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/ocr/Constants.h>
#include <rnexecutorch/models/ocr/DetectorUtils.h>

#include <executorch/extension/tensor/tensor_ptr.h>

namespace rnexecutorch {
VerticalDetector::VerticalDetector(
    const std::string &modelSource, bool detectSingleCharacters,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  this->detectSingleCharacters = detectSingleCharacters;
  auto inputShapes = getAllInputShapes();
  if (inputShapes.empty()) {
    throw std::runtime_error(
        "Detector model seems to not take any input tensors.");
  }
  std::vector<int32_t> modelInputShape = inputShapes[0];
  if (modelInputShape.size() < 2) {
    throw std::runtime_error("Unexpected detector model input size, expected "
                             "at least 2 dimensions but got: " +
                             std::to_string(modelInputShape.size()) + ".");
  }
  modelImageSize = cv::Size(modelInputShape[modelInputShape.size() - 1],
                            modelInputShape[modelInputShape.size() - 2]);
}

cv::Size VerticalDetector::getModelImageSize() const noexcept {
  return modelImageSize;
}

std::vector<ocr::DetectorBBox>
VerticalDetector::generate(const cv::Mat &inputImage) {
  auto inputShapes = getAllInputShapes();
  cv::Mat resizedInputImage =
      imageprocessing::resizePadded(inputImage, getModelImageSize());
  TensorPtr inputTensor = imageprocessing::getTensorFromMatrix(
      inputShapes[0], resizedInputImage, ocr::MEAN, ocr::VARIANCE);
  auto forwardResult = BaseModel::forward(inputTensor);
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Failed to forward, error: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }
  return postprocess(forwardResult->at(0).toTensor());
}

std::vector<ocr::DetectorBBox>
VerticalDetector::postprocess(const Tensor &tensor) const {
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
  auto [scoreTextMat, scoreAffinityMat] = ocr::interleavedArrayToMats(
      tensorData,
      cv::Size(modelImageSize.width / 2, modelImageSize.height / 2));
  float txtThreshold = this->detectSingleCharacters
                           ? ocr::TEXT_THRESHOLD
                           : ocr::TEXT_THRESHOLD_VERTICAL;
  std::vector<ocr::DetectorBBox> bBoxesList =
      ocr::getDetBoxesFromTextMapVertical(scoreTextMat, scoreAffinityMat,
                                          txtThreshold, ocr::LINK_THRESHOLD,
                                          this->detectSingleCharacters);
  const float restoreRatio =
      ocr::calculateRestoreRatio(scoreTextMat.rows, ocr::RECOGNIZER_IMAGE_SIZE);
  ocr::restoreBboxRatio(bBoxesList, restoreRatio);

  // if this is Narrow Detector, do not group boxes.
  if (!this->detectSingleCharacters) {
    bBoxesList = ocr::groupTextBoxes(
        bBoxesList, ocr::CENTER_THRESHOLD, ocr::DISTANCE_THRESHOLD,
        ocr::HEIGHT_THRESHOLD, ocr::MIN_SIDE_THRESHOLD, ocr::MAX_SIDE_THRESHOLD,
        ocr::MAX_WIDTH);
  }

  return bBoxesList;
}

} // namespace rnexecutorch
