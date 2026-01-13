#include "Detector.h"
#include "Constants.h"
#include <cstdint>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/ocr/Constants.h>
#include <rnexecutorch/models/ocr/utils/DetectorUtils.h>
#include <string>

namespace rnexecutorch::models::ocr {
Detector::Detector(const std::string &modelSource,
                   std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {

  for (auto input_size : constants::kDetectorInputWidths) {
    std::string methodName = "forward_" + std::to_string(input_size);
    auto inputShapes = getAllInputShapes(methodName);
    if (inputShapes[0].size() < 2) {
      char errorMessage[150];
      std::snprintf(errorMessage, sizeof(errorMessage),
                    "Unexpected detector model input size for method: %s, "
                    "expected at least 2 dimensions but got: %zu.",
                    methodName.c_str(), inputShapes[0].size());
      throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                              errorMessage);
    }
  }
}

std::vector<types::DetectorBBox> Detector::generate(const cv::Mat &inputImage,
                                                    int32_t inputWidth) {
  /*
   Detector as an input accepts tensor with a shape of [1, 3, H, H].
   where H is a constant for model. In our supported model it is currently
   either H=800 or H=1280.
   Due to big influence of resize to quality of recognition the image preserves
   original aspect ratio and the missing parts are filled with padding.
   */

  utils::validateInputWidth(inputWidth, constants::kDetectorInputWidths,
                            "Detector");

  std::string methodName = "forward_" + std::to_string(inputWidth);
  auto inputShapes = getAllInputShapes(methodName);

  cv::Size modelInputSize = calculateModelImageSize(inputWidth);

  cv::Mat resizedInputImage =
      image_processing::resizePadded(inputImage, modelInputSize);
  TensorPtr inputTensor = image_processing::getTensorFromMatrix(
      inputShapes[0], resizedInputImage, constants::kNormalizationMean,
      constants::kNormalizationVariance);
  auto forwardResult = BaseModel::execute(methodName, {inputTensor});

  if (!forwardResult.ok()) {
    throw RnExecutorchError(forwardResult.error(),
                            "The model's forward function did not succeed. "
                            "Ensure the model input is correct.");
  }

  return postprocess(forwardResult->at(0).toTensor(), modelInputSize);
}

cv::Size Detector::calculateModelImageSize(int32_t methodInputWidth) {

  utils::validateInputWidth(methodInputWidth, constants::kDetectorInputWidths,
                            "Detector");
  std::string methodName = "forward_" + std::to_string(methodInputWidth);

  auto inputShapes = getAllInputShapes(methodName);
  std::vector<int32_t> modelInputShape = inputShapes[0];
  cv::Size modelInputSize =
      cv::Size(modelInputShape[modelInputShape.size() - 1],
               modelInputShape[modelInputShape.size() - 2]);
  return modelInputSize;
}

std::vector<types::DetectorBBox>
Detector::postprocess(const Tensor &tensor, const cv::Size &modelInputSize) {
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
  auto [scoreTextMat, scoreAffinityMat] = utils::interleavedArrayToMats(
      tensorData,
      cv::Size(modelInputSize.width / 2, modelInputSize.height / 2));

  /*
   Heatmaps are then converted into list of bounding boxes.
  */
  std::vector<types::DetectorBBox> bBoxesList = utils::getDetBoxesFromTextMap(
      scoreTextMat, scoreAffinityMat, constants::kTextThreshold,
      constants::kLinkThreshold, constants::kLowTextThreshold);

  /*
   Bounding boxes are at first corresponding to the 400x400 size or 640x640.
   RecognitionHandler in the later part of processing works on images of size
   1280x1280. To match this difference we has to scale  by the proper factor
   (3.2 or 2.0).
  */
  const float restoreRatio = utils::calculateRestoreRatio(
      scoreTextMat.rows, constants::kRecognizerImageSize);
  utils::restoreBboxRatio(bBoxesList, restoreRatio);
  /*
   Since every bounding box is processed separately by Recognition models, we'd
   like to reduce the number of boxes. Also, grouping nearby boxes means we
   process many words / full line at once. It is not only faster but also easier
   for Recognizer models than recognition of single characters.
  */
  bBoxesList = utils::groupTextBoxes(
      bBoxesList, constants::kCenterThreshold, constants::kDistanceThreshold,
      constants::kHeightThreshold, constants::kMinSideThreshold,
      constants::kMaxSideThreshold, constants::kMaxWidth);

  return bBoxesList;
}

} // namespace rnexecutorch::models::ocr
