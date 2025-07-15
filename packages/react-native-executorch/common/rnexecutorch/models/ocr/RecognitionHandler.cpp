#include "RecognitionHandler.h"
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/ocr/Constants.h>
#include <rnexecutorch/models/ocr/RecognitionHandlerUtils.h>

namespace rnexecutorch {
RecognitionHandler::RecognitionHandler(
    std::string recognizerSourceLarge, std::string recognizerSourceMedium,
    std::string recognizerSourceSmall, std::string symbols,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : converter(symbols), recognizerLarge(recognizerSourceLarge, callInvoker),
      recognizerMedium(recognizerSourceMedium, callInvoker),
      recognizerSmall(recognizerSourceSmall, callInvoker) {
  memorySizeLowerBound = recognizerSmall.getMemoryLowerBound() +
                         recognizerMedium.getMemoryLowerBound() +
                         recognizerLarge.getMemoryLowerBound();
}

std::pair<std::vector<int32_t>, float>
RecognitionHandler::runModel(cv::Mat image) {
  if (image.cols >= ocr::largeRecognizerWidth) {
    return recognizerLarge.generate(image);
  } else if (image.cols >= ocr::mediumRecognizerWidth) {
    return recognizerMedium.generate(image);
  }
  return recognizerSmall.generate(image);
}

std::vector<OCRDetection>
RecognitionHandler::recognize(std::vector<DetectorBBox> bboxesList,
                              cv::Mat imgGray, cv::Size desiredSize) {
  auto [resizeRatio, top, left] =
      ocr::calculateResizeRatioAndPaddings(imgGray.size(), desiredSize);
  auto resizedImg = imageprocessing::resizePadded(imgGray, desiredSize);

  auto result = std::vector<OCRDetection>();
  result.reserve(bboxesList.size());

  for (auto box : bboxesList) {
    auto croppedImage = ocr::cropImage(box, resizedImg, ocr::recognizerHeight);
    if (croppedImage.empty())
      continue;
    auto [predictionIndices, confidenceScore] = runModel(croppedImage);
    std::vector<std::string> decodedTexts;
    if (confidenceScore < ocr::lowConfidenceThreshold) {
      cv::rotate(croppedImage, croppedImage, cv::ROTATE_180);
      auto [rotatedPredictionIndices, rotatedConfidenceScore] =
          runModel(croppedImage);
      if (rotatedConfidenceScore > confidenceScore) {
        confidenceScore = rotatedConfidenceScore;
        predictionIndices = rotatedPredictionIndices;
      }
      decodedTexts =
          converter.decodeGreedy(predictionIndices, predictionIndices.size());
    }
    for (auto &point : box.bbox) {
      point.x = (point.x - left) * resizeRatio;
      point.y = (point.y - top) * resizeRatio;
    }
    result.emplace_back(box.bbox, decodedTexts[0], confidenceScore);
  }
  return result;
}

std::size_t RecognitionHandler::getMemoryLowerBound() {
  return memorySizeLowerBound;
}

void RecognitionHandler::unload() {
  recognizerSmall.unload();
  recognizerMedium.unload();
  recognizerLarge.unload();
}
} // namespace rnexecutorch