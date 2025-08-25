#include "VerticalOCR.h"
#include <future>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/data_processing/Numerical.h>
#include <rnexecutorch/models/ocr/Types.h>
#include <tuple>

namespace rnexecutorch::models::ocr {
VerticalOCR::VerticalOCR(const std::string &detectorLargeSource,
                         const std::string &detectorNarrowSource,
                         const std::string &recognizerSource,
                         std::string symbols, bool independentChars,
                         std::shared_ptr<react::CallInvoker> invoker)
    : detectorLarge(detectorLargeSource, false, invoker),
      detectorNarrow(detectorNarrowSource, true, invoker),
      recognizer(recognizerSource, invoker), converter(symbols),
      independentCharacters(independentChars), callInvoker(invoker) {}

std::vector<types::OCRDetection> VerticalOCR::generate(std::string input) {
  cv::Mat image = image_processing::readImage(input);
  if (image.empty()) {
    throw std::runtime_error("Failed to load image from path: " + input);
  }
  // 1. Large Detector
  std::vector<types::DetectorBBox> largeBoxes = detectorLarge.generate(image);

  cv::Size largeDetectorSize = detectorLarge.getModelImageSize();
  cv::Mat resizedImage =
      image_processing::resizePadded(image, largeDetectorSize);
  types::PaddingInfo imagePaddings =
      utils::calculateResizeRatioAndPaddings(image.size(), largeDetectorSize);

  std::vector<types::OCRDetection> predictions;
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
    const types::DetectorBBox &box, const cv::Mat &originalImage,
    const std::vector<types::DetectorBBox> &characterBoxes,
    const types::PaddingInfo &paddingsBox,
    const types::PaddingInfo &imagePaddings) {
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
    auto croppedChar = utils::prepareForRecognition(
        originalImage, characterBox.bbox, box.bbox, paddingsBox, imagePaddings);

    /*
     To make Recognition simpler, we convert cropped character image
     to a bit mask with white character and black background.
    */
    croppedChar = utils::characterBitMask(croppedChar);
    croppedChar = utils::normalizeForRecognizer(
        croppedChar, constants::kRecognizerHeight, 0.0, true);

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
    const types::DetectorBBox &box, const cv::Mat &originalImage,
    const std::vector<types::DetectorBBox> &characterBoxes,
    const types::PaddingInfo &paddingsBox,
    const types::PaddingInfo &imagePaddings) {
  std::string text;
  std::vector<cv::Mat> croppedCharacters;
  croppedCharacters.reserve(characterBoxes.size());
  for (const auto &characterBox : characterBoxes) {
    /*
     Prepare for Recognition by following steps:
     1. Crop image to the character bounding box,
     2. Convert Image to gray.
     3. Resize it to [kSmallVerticalRecognizerWidth x kRecognizerHeight] (64 x
     64). The same height is required for horizontal concatenation of single
     characters into one image.
    */
    auto croppedChar = utils::prepareForRecognition(
        originalImage, characterBox.bbox, box.bbox, paddingsBox, imagePaddings);
    croppedCharacters.push_back(croppedChar);
  }

  cv::Mat mergedCharacters;
  cv::hconcat(croppedCharacters, mergedCharacters);
  mergedCharacters = image_processing::resizePadded(
      mergedCharacters,
      cv::Size(constants::kLargeRecognizerWidth, constants::kRecognizerHeight));
  mergedCharacters = utils::normalizeForRecognizer(
      mergedCharacters, constants::kRecognizerHeight, 0.0, false);

  const auto &[predIndex, confidenceScore] =
      recognizer.generate(mergedCharacters);
  if (!predIndex.empty()) {
    text = converter.decodeGreedy(predIndex, predIndex.size())[0];
  }
  return {text, confidenceScore};
}

types::OCRDetection VerticalOCR::_processSingleTextBox(
    types::DetectorBBox &box, const cv::Mat &originalImage,
    const cv::Mat &resizedLargeImage, const types::PaddingInfo &imagePaddings) {
  cv::Rect boundingBox = utils::extractBoundingBox(box.bbox);

  // Crop the image for detection of single characters.
  cv::Rect safeRect =
      boundingBox & cv::Rect(0, 0, resizedLargeImage.cols,
                             resizedLargeImage.rows); // ensure valid box
  cv::Mat croppedLargeBox = resizedLargeImage(safeRect);

  // 2. Narrow Detector - detects single characters
  std::vector<types::DetectorBBox> characterBoxes =
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
    types::PaddingInfo paddingsBox = utils::calculateResizeRatioAndPaddings(
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
  std::array<types::Point, 4> finalBbox;
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
} // namespace rnexecutorch::models::ocr
