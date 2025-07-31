#include "Detector.h"
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/ocr/Constants.h>
#include <rnexecutorch/models/ocr/DetectorUtils.h>

namespace rnexecutorch {

/*
The model used as detector is based on CRAFT (Character Region Awareness for
Text Detection) paper. https://arxiv.org/pdf/1904.01941
*/

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

std::vector<DetectorBBox> Detector::generate(const cv::Mat &inputImage) {
  /*
   Detector as an input accepts tensor with a shape of [1, 3, 800, 800].
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

std::vector<DetectorBBox>
Detector::postprocess(const Tensor &tensor) const noexcept {
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
  std::vector<DetectorBBox> bBoxesList = ocr::getDetBoxesFromTextMap(
      scoreTextMat, scoreAffinityMat, ocr::textThreshold, ocr::linkThreshold,
      ocr::lowTextThreshold);

  ocr::restoreBboxRatio(bBoxesList, ocr::restoreRatio);

  bBoxesList = ocr::groupTextBoxes(bBoxesList, ocr::centerThreshold,
                                   ocr::distanceThreshold, ocr::heightThreshold,
                                   ocr::minSideThreshold, ocr::maxSideThreshold,
                                   ocr::maxWidth);

  return bBoxesList;
}

} // namespace rnexecutorch
