#include "VerticalOCR.h"
#include <future>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/data_processing/Numerical.h>
#include <rnexecutorch/models/ocr/Types.h>
#include <tuple>
namespace rnexecutorch {

/*
  Vertical OCR is OCR designed to handle vertical texts.
  Vertical OCR pipeline consists of:
  1. Large Detector -- detects regions where text is located.
     Almost identical to the Detector in standard OCR.
     The result of this phase is a list of bounding boxes.
  Each detected box is then processed individually through the following steps:
    2. Narrow Detector -- designed for detecting where single characters
       are located.
    There are two different strategies used for vertical recognition:
      Strategy 1 "Independent Characters":
        Treating each character region found  by Narrow Detector
        as compeletely independent.
        3. Each character is forwarded to Small Recognizer (64 x 64).
      Strategy 2 "Joint Characters":
        The bounding boxes found by Narrow Detector are
        horizontally merged to create one wide image.
        3. One wide image is forwarded to Large Recognzer (512 x 64).
    Vertical OCR differentiate between those two strategies based on
    `independentChars` flag passed to the constructor.
*/
VerticalOCR::VerticalOCR(const std::string &detectorLargeSource,
                         const std::string &detectorNarrowSource,
                         const std::string &recognizerSource,
                         std::string symbols, bool independentChars,
                         std::shared_ptr<react::CallInvoker> invoker)
    : detectorLarge(detectorLargeSource, false, invoker),
      detectorNarrow(detectorNarrowSource, true, invoker),
      recognizer(recognizerSource, invoker), converter(symbols),
      independentCharacters(independentChars), callInvoker(invoker) {}

std::vector<OCRDetection> VerticalOCR::generate(std::string input) {
  cv::Mat image = imageprocessing::readImage(input);
  if (image.empty()) {
    throw std::runtime_error("Failed to load image from path: " + input);
  }
  // 1. Large Detector
  std::vector<DetectorBBox> largeBoxes = detectorLarge.generate(image);

  cv::Size largeDetectorSize = detectorLarge.getModelImageSize();
  cv::Mat resizedImage =
      imageprocessing::resizePadded(image, largeDetectorSize);
  PaddingInfo imagePaddings =
      ocr::calculateResizeRatioAndPaddings(image.size(), largeDetectorSize);

  std::vector<OCRDetection> predictions;
  predictions.reserve(largeBoxes.size());

  for (auto &box : largeBoxes) {
    predictions.push_back(
        _processSingleTextBox(box, image, resizedImage, imagePaddings));
  }

  return predictions;
}

std::size_t VerticalOCR::getMemoryLowerBound() const noexcept {
  return detectorLarge.getMemoryLowerBound() +
         detectorNarrow.getMemoryLowerBound() +
         recognizer.getMemoryLowerBound();
}

// Strategy 1: Recognize each character individually
std::pair<std::string, float> VerticalOCR::_handleIndependentCharacters(
    const DetectorBBox &box, const cv::Mat &originalImage,
    const std::vector<DetectorBBox> &characterBoxes,
    const PaddingInfo &paddingsBox, const PaddingInfo &imagePaddings) {
  std::string text;
  float confidenceScore = 0.0f;
  float totalScore = 0.0f;
  for (const auto &characterBox : characterBoxes) {

    /*
     Prepare for Recognition by following steps:
     1. Crop image to the character bounding box,
     2. Convert Image to gray.
     3. Resize it to [VerticalSmallRecognizerWidth x RecognizerHeight] (64 x
     64),
    */
    auto croppedChar = ocr::prepareForRecognition(
        originalImage, characterBox.bbox, box.bbox, paddingsBox, imagePaddings);

    /*
     To make Recognition simpler, we convert cropped character image
     to a bit mask with wite character and black background.
    */
    croppedChar = ocr::characterBitMask(croppedChar);

    // Final modification needed for Recognizer
    croppedChar = ocr::normalizeForRecognizer(croppedChar,
                                              ocr::recognizerHeight, 0.0, true);

    const auto &[predIndex, score] = recognizer.generate(croppedChar);
    if (!predIndex.empty()) {
      text += converter.decodeGreedy(predIndex, predIndex.size())[0];
    }
    totalScore += score;
  }
  confidenceScore = totalScore / characterBoxes.size();
  return {text, confidenceScore};
}

// Strategy 2: Concatenate characters and recognize as a single line
std::pair<std::string, float> VerticalOCR::_handleJointCharacters(
    const DetectorBBox &box, const cv::Mat &originalImage,
    const std::vector<DetectorBBox> &characterBoxes,
    const PaddingInfo &paddingsBox, const PaddingInfo &imagePaddings) {
  std::string text;
  std::vector<cv::Mat> croppedCharacters;
  croppedCharacters.reserve(characterBoxes.size());
  for (const auto &characterBox : characterBoxes) {
    /*
     Prepare for Recognition by following steps:
     1. Crop image to the character bounding box,
     2. Convert Image to gray.
     3. Resize it to [smallVerticalRecognizerWidth x recognizerHeight] (64 x
     64). The same height is required for horizontal concatenation of single
     characters into one image.
    */
    auto croppedChar = ocr::prepareForRecognition(
        originalImage, characterBox.bbox, box.bbox, paddingsBox, imagePaddings);
    croppedCharacters.push_back(croppedChar);
  }

  cv::Mat mergedCharacters;
  cv::hconcat(croppedCharacters, mergedCharacters);
  // Resize and prepare merged image for Recognizer
  mergedCharacters = imageprocessing::resizePadded(
      mergedCharacters,
      cv::Size(ocr::largeRecognizerWidth, ocr::recognizerHeight));
  mergedCharacters = ocr::normalizeForRecognizer(
      mergedCharacters, ocr::recognizerHeight, 0.0, false);

  const auto &[predIndex, confidenceScore] =
      recognizer.generate(mergedCharacters);
  if (!predIndex.empty()) {
    text = converter.decodeGreedy(predIndex, predIndex.size())[0];
  }
  return {text, confidenceScore};
}

OCRDetection VerticalOCR::_processSingleTextBox(
    DetectorBBox &box, const cv::Mat &originalImage,
    const cv::Mat &resizedLargeImage, const PaddingInfo &imagePaddings) {
  cv::Rect boundingBox = ocr::extractBoundingBox(box.bbox);

  // Crop the image for detection of single characters.
  cv::Rect safeRect =
      boundingBox & cv::Rect(0, 0, resizedLargeImage.cols,
                             resizedLargeImage.rows); // ensure valid box
  cv::Mat croppedLargeBox = resizedLargeImage(safeRect);

  // 2. Narrow Detector - detects single characters
  std::vector<DetectorBBox> characterBoxes =
      detectorNarrow.generate(croppedLargeBox);

  std::string text;
  float confidenceScore = 0.0;
  if (!characterBoxes.empty()) {
    // Prepare information useful for proper boxes shifting and image cropping.
    const int32_t boxWidth =
        static_cast<int32_t>(box.bbox[2].x - box.bbox[0].x);
    const int32_t boxHeight =
        static_cast<int32_t>(box.bbox[2].y - box.bbox[0].y);
    cv::Size narrowRecognizerSize = detectorNarrow.getModelImageSize();
    PaddingInfo paddingsBox = ocr::calculateResizeRatioAndPaddings(
        cv::Size(boxWidth, boxHeight), narrowRecognizerSize);

    // 3. Recognition - decide between Strategy 1 and Strategy 2.
    std::tie(text, confidenceScore) =
        independentCharacters
            ? _handleIndependentCharacters(box, originalImage, characterBoxes,
                                           paddingsBox, imagePaddings)
            : _handleJointCharacters(box, originalImage, characterBoxes,
                                     paddingsBox, imagePaddings);
  }
  // Modify the returned boxes to match the original image size
  std::array<Point, 4> finalBbox;
  for (size_t i = 0; i < box.bbox.size(); ++i) {
    finalBbox[i].x =
        (box.bbox[i].x - imagePaddings.left) * imagePaddings.resizeRatio;
    finalBbox[i].y =
        (box.bbox[i].y - imagePaddings.top) * imagePaddings.resizeRatio;
  }

  return {finalBbox, text, confidenceScore};
}

void VerticalOCR::unload() noexcept {
  detectorLarge.unload();
  detectorNarrow.unload();
  recognizer.unload();
}
} // namespace rnexecutorch
