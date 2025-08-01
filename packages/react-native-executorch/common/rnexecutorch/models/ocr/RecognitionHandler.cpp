#include "RecognitionHandler.h"
#include "RecognitionHandlerUtils.h"
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/ocr/Constants.h>
#include <rnexecutorch/models/ocr/RecognitionHandlerUtils.h>

namespace rnexecutorch {
RecognitionHandler::RecognitionHandler(
    const std::string &recognizerSourceLarge,
    const std::string &recognizerSourceMedium,
    const std::string &recognizerSourceSmall, std::string symbols,
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
  }
  if (image.cols >= ocr::mediumRecognizerWidth) {
    return recognizerMedium.generate(image);
  }
  return recognizerSmall.generate(image);
}

std::vector<OCRDetection>
RecognitionHandler::recognize(std::vector<DetectorBBox> bboxesList,
                              cv::Mat &imgGray, cv::Size desiredSize) {
  PaddingInfo ratioAndPadding =
      ocr::calculateResizeRatioAndPaddings(imgGray.size(), desiredSize);
  imgGray = imageprocessing::resizePadded(imgGray, desiredSize);

  std::vector<OCRDetection> result = {};

  for (auto &box : bboxesList) {
    auto croppedImage = ocr::cropImage(box, imgGray, ocr::recognizerHeight);

    if (croppedImage.empty()) {
      continue;
    }
    croppedImage = ocr::normalizeForRecognizer(
        croppedImage, ocr::recognizerHeight, ocr::adjustContrast, false);
    auto [predictionIndices, confidenceScore] = this->runModel(croppedImage);
    if (confidenceScore < ocr::lowConfidenceThreshold) {
      cv::rotate(croppedImage, croppedImage, cv::ROTATE_180);
      auto [rotatedPredictionIndices, rotatedConfidenceScore] =
          runModel(croppedImage);
      if (rotatedConfidenceScore > confidenceScore) {
        confidenceScore = rotatedConfidenceScore;
        predictionIndices = rotatedPredictionIndices;
      }
    }

    for (auto &point : box.bbox) {
      point.x = (point.x - ratioAndPadding.left) * ratioAndPadding.resizeRatio;
      point.y = (point.y - ratioAndPadding.top) * ratioAndPadding.resizeRatio;
    }

    result.push_back(
        {box.bbox,
         converter.decodeGreedy(predictionIndices, predictionIndices.size())[0],
         confidenceScore});
  }

  return result;
}

std::size_t RecognitionHandler::getMemoryLowerBound() const noexcept {
  return memorySizeLowerBound;
}

void RecognitionHandler::unload() noexcept {
  recognizerSmall.unload();
  recognizerMedium.unload();
  recognizerLarge.unload();
}
} // namespace rnexecutorch
