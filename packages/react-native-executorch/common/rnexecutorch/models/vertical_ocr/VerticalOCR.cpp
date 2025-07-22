#include "VerticalOCR.h"

#include <future>
#include <rnexecutorch/Log.h>
#include <vector>

#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/data_processing/Numerical.h>
#include <rnexecutorch/models/ocr/Types.h>

namespace rnexecutorch {

VerticalOCR::VerticalOCR(const std::string &detectorLargeSource,
                         const std::string &detectorNarrowSource,
                         const std::string &recognizerSource,
                         const std::string symbols,
                         const bool indpendentCharacters,
                         std::shared_ptr<react::CallInvoker> callInvoker)
    : detectorLarge(detectorLargeSource, false, callInvoker),
      detectorNarrow(detectorNarrowSource, true, callInvoker),
      recognizer(recognizerSource, callInvoker), converter(symbols) {
  this->independentCharacters = indpendentCharacters;
  this->symbols = symbols;
  this->callInvoker = callInvoker;
}

std::vector<OCRDetection> VerticalOCR::generate(std::string input) {
  cv::Mat image = imageprocessing::readImage(input);
  if (image.empty()) {
    throw std::runtime_error("Failed to load image from path: " + input);
  }

  std::vector<DetectorBBox> largeBoxes = detectorLarge.generate(image);

  cv::Size largeDetectorSize = detectorLarge.getModelImageSize();
  cv::Mat resizedImage =
      imageprocessing::resizePadded(image, largeDetectorSize);
  std::vector<OCRDetection> predictions;

  for (const auto &box : largeBoxes) {
    const int boxWidth = static_cast<int>(box.bbox[2].x - box.bbox[0].x);
    const int boxHeight = static_cast<int>(box.bbox[2].y - box.bbox[0].y);
    cv::Rect boundingBox = ocr::extractBoundingBox(box.bbox);
    cv::Mat croppedImage = resizedImage(boundingBox);
    cv::Size narrowRecognizerSize = detectorNarrow.getModelImageSize();
    PaddingInfo paddings = ocr::calculateResizeRatioAndPaddings(
        cv::Size(image.cols, image.rows), largeDetectorSize);

    std::string text = "";
    float confidenceScore = 0.0f;
    std::vector<DetectorBBox> characterBoxes =
        detectorNarrow.generate(croppedImage);

    std::vector<cv::Mat> croppedCharacters;

    for (const auto &characterBox : characterBoxes) {
      PaddingInfo paddingsBox = ocr::calculateResizeRatioAndPaddings(
          cv::Size(boxWidth, boxHeight),
          cv::Size(narrowRecognizerSize.width, narrowRecognizerSize.height));
      cv::Mat croppedCharacter = ocr::cropImageWithBoundingBox(
          image, characterBox.bbox, box.bbox, paddingsBox, paddings);

      if (independentCharacters) {
        const int recognizerHeight = 64;
        croppedCharacter = ocr::cropSingleCharacter(croppedCharacter);
        croppedCharacter = ocr::normalizeForRecognizer(
            croppedCharacter, recognizerHeight, 0.0, true);

        auto recognitionResult = recognizer.generate(croppedCharacter);
        auto &predIndex = recognitionResult.first;
        auto &score = recognitionResult.second;

        std::vector<std::string> decodedText =
            converter.decodeGreedy(predIndex, predIndex.size());
        text += decodedText[0];
        confidenceScore += score;
      } else {
        croppedCharacters.push_back(croppedCharacter);
      }
    }

    if (independentCharacters) {
      if (!characterBoxes.empty()) {
        confidenceScore /= characterBoxes.size();
      }
    } else {
      if (!croppedCharacters.empty()) {
        cv::Mat mergedCharacters;
        cv::hconcat(croppedCharacters, mergedCharacters);

        const int recognizerHeight = 64;

        mergedCharacters = imageprocessing::resizePadded(
            mergedCharacters,
            cv::Size(ocr::largeRecognizerWidth, recognizerHeight));

        mergedCharacters = ocr::normalizeForRecognizer(
            mergedCharacters, recognizerHeight, 0.0, false);
        auto recognitionResult = recognizer.generate(mergedCharacters);
        auto &predIndex = recognitionResult.first;
        auto &score = recognitionResult.second;
        std::vector<std::string> decodedText =
            converter.decodeGreedy(predIndex, predIndex.size());
        if (!decodedText.empty()) {
          text = decodedText[0];
        }
        confidenceScore = score;
      }
    }

    std::vector<cv::Point2f> newCoords;
    for (const auto &point : box.bbox) {
      float newX = (point.x - paddings.left) * paddings.resizeRatio;
      float newY = (point.y - paddings.top) * paddings.resizeRatio;
      newCoords.emplace_back(newX, newY);
    }

    predictions.push_back(OCRDetection{
        std::array<Point, 4>{Point{newCoords[0].x, newCoords[0].y},
                             Point{newCoords[1].x, newCoords[1].y},
                             Point{newCoords[2].x, newCoords[2].y},
                             Point{newCoords[3].x, newCoords[3].y}},
        text, confidenceScore});
  }

  return predictions;
}

std::size_t VerticalOCR::getMemoryLowerBound() {
  return detectorLarge.getMemoryLowerBound() +
         detectorNarrow.getMemoryLowerBound() +
         recognizer.getMemoryLowerBound();
}

} // namespace rnexecutorch
