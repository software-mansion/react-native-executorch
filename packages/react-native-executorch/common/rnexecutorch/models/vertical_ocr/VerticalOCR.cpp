#include "VerticalOCR.h"
#include <future>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/data_processing/Numerical.h>
#include <rnexecutorch/models/ocr/Types.h>
#include <vector>

namespace rnexecutorch {

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

OCRDetection VerticalOCR::_processSingleTextBox(
    DetectorBBox &box, const cv::Mat &originalImage,
    const cv::Mat &resizedLargeImage, const PaddingInfo &imagePaddings) {
  cv::Rect boundingBox = ocr::extractBoundingBox(box.bbox);
  cv::Mat croppedLargeBox = resizedLargeImage(boundingBox);

  std::vector<DetectorBBox> characterBoxes =
      detectorNarrow.generate(croppedLargeBox);

  std::string text;
  float confidenceScore = 0.0f;

  if (!characterBoxes.empty()) {
    const int boxWidth = static_cast<int>(box.bbox[2].x - box.bbox[0].x);
    const int boxHeight = static_cast<int>(box.bbox[2].y - box.bbox[0].y);
    cv::Size narrowRecognizerSize = detectorNarrow.getModelImageSize();
    PaddingInfo paddingsBox = ocr::calculateResizeRatioAndPaddings(
        cv::Size(boxWidth, boxHeight),
        cv::Size(narrowRecognizerSize.width, narrowRecognizerSize.height));

    if (independentCharacters) {
      // Strategy 1: Recognize each character individually
      float totalScore = 0.0f;
      for (const auto &characterBox : characterBoxes) {
        cv::Mat croppedChar =
            ocr::cropImageWithBoundingBox(originalImage, characterBox.bbox,
                                          box.bbox, paddingsBox, imagePaddings);
        croppedChar = ocr::cropSingleCharacter(croppedChar);
        croppedChar = ocr::normalizeForRecognizer(
            croppedChar, ocr::recognizerHeight, 0.0, true);

        const auto &[predIndex, score] = recognizer.generate(croppedChar);
        if (!predIndex.empty()) {
          text += converter.decodeGreedy(predIndex, predIndex.size())[0];
        }
        totalScore += score;
      }
      confidenceScore = totalScore / characterBoxes.size();
    } else {
      // Strategy 2: Concatenate characters and recognize as a single line
      std::vector<cv::Mat> croppedCharacters;
      croppedCharacters.reserve(characterBoxes.size());
      for (const auto &characterBox : characterBoxes) {
        croppedCharacters.push_back(ocr::cropImageWithBoundingBox(
            originalImage, characterBox.bbox, box.bbox, paddingsBox,
            imagePaddings));
      }

      cv::Mat mergedCharacters;
      cv::hconcat(croppedCharacters, mergedCharacters);
      mergedCharacters = imageprocessing::resizePadded(
          mergedCharacters,
          cv::Size(ocr::largeRecognizerWidth, ocr::recognizerHeight));
      mergedCharacters = ocr::normalizeForRecognizer(
          mergedCharacters, ocr::recognizerHeight, 0.0, false);

      const auto &[predIndex, score] = recognizer.generate(mergedCharacters);
      if (!predIndex.empty()) {
        text = converter.decodeGreedy(predIndex, predIndex.size())[0];
      }
      confidenceScore = score;
    }
  }

  std::array<Point, 4> finalBbox;
  for (size_t i = 0; i < box.bbox.size(); ++i) {
    finalBbox[i].x =
        (box.bbox[i].x - imagePaddings.left) * imagePaddings.resizeRatio;
    finalBbox[i].y =
        (box.bbox[i].y - imagePaddings.top) * imagePaddings.resizeRatio;
  }

  return {finalBbox, text, confidenceScore};
}
} // namespace rnexecutorch
