#include "Detector.h"
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/ocr/Constants.h>
#include <rnexecutorch/models/ocr/DetectorUtils.h>

namespace rnexecutorch {
Detector::Detector(const std::string &modelSource,
                   std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
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

cv::Size Detector::getModelImageSize() const noexcept { return modelImageSize; }

std::vector<ocr::DetectorBBox> Detector::generate(const cv::Mat &inputImage) {
  /*
   Detector as an input accepts tensor with a shape of [1, 3, H, H].
   where H is a constant for model. In our supported models it is currently
   either H=800 or H=1280.
   Due to big influence of resize to quality of recognition the image preserves
   original aspect ratio and the missing parts are filled with padding.
   */
  auto inputShapes = getAllInputShapes();
  cv::Mat resizedInputImage =
      imageprocessing::resizePadded(inputImage, getModelImageSize());
  TensorPtr inputTensor = imageprocessing::getTensorFromMatrix(
      inputShapes[0], resizedInputImage, ocr::mean, ocr::variance);
  auto forwardResult = BaseModel::forward(inputTensor);
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Failed to forward, error: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }

  return postprocess(forwardResult->at(0).toTensor());
}

std::vector<ocr::DetectorBBox>
Detector::postprocess(const Tensor &tensor) const {
  /*
   The output of the model consists of two matrices (heat maps):
   1. ScoreText(Score map) - The probability of a region containing character.
   2. ScoreAffinity(Affinity map) - affinity between characters, used to to
   group each character into a single instance (sequence) Both matrices are
   H/2xW/2 (400x400 or 640x640).
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

  /*
   Heatmaps are then converted into list of bounding boxes.
   Too see how it is achieved see the description of this function in
   the DetectorUtils.h source file and the implementation in the
   DetectorUtils.cpp.
  */
  std::vector<ocr::DetectorBBox> bBoxesList = ocr::getDetBoxesFromTextMap(
      scoreTextMat, scoreAffinityMat, ocr::textThreshold, ocr::linkThreshold,
      ocr::lowTextThreshold);

  /*
   Bounding boxes are at first corresponding to the 400x400 size or 640x640.
   RecognitionHandler in the later part of processing works on images of size
   1280x1280. To match this difference we has to scale  by the proper factor
   (3.2 or 2.0).
  */
  const float restoreRatio =
      ocr::calculateRestoreRatio(scoreTextMat.rows, ocr::recognizerImageSize);
  ocr::restoreBboxRatio(bBoxesList, restoreRatio);
  /*
   Since every bounding box is processed separately by Recognition models, we'd
   like to reduce the number of boxes. Also, grouping nearby boxes means we
   process many words / full line at once. It is not only faster but also easier
   for Recognizer models than recognition of single characters.
  */
  bBoxesList = ocr::groupTextBoxes(bBoxesList, ocr::centerThreshold,
                                   ocr::distanceThreshold, ocr::heightThreshold,
                                   ocr::minSideThreshold, ocr::maxSideThreshold,
                                   ocr::maxWidth);

  return bBoxesList;
}

} // namespace rnexecutorch
