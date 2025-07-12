#include "OCR.h"

#include <rnexecutorch/models/ocr/Constants.h>

namespace rnexecutorch {
OCR::OCR(std::string detectorSource, std::string recognizerSourceLarge,
         std::string recognizerSourceMedium, std::string recognizerSourceSmall,
         std::string symbols, std::shared_ptr<react::CallInvoker> callInvoker)
    : detector(detectorSource, callInvoker),
      recognitionHandler(symbols, recognizerSourceLarge, recognizerSourceMedium,
                         recognizerSourceSmall, callInvoker) {}

std::vector<OCRDetection> OCR::forward(std::string input) {
  std::vector<DetectorBBox> detectorResult = detector.forward(input);
  cv::Mat grayscaleImg = imageprocessing::readImage(input);
  cv::cvtColor(grayscaleImg, grayscaleImg, cv::COLOR_BGR2GRAY);
  std::vector<OCRDetection> result = recognitionHandler.recognize(
      detectorResult, grayscaleImg, recognizerImageSize, recognizerImageSize);
  return result;
}

void OCR::unloadModule() {
  detector.unload();
  recognitionHandler.unload();
}

std::size_t OCR::getMemoryLowerBound() {
  return detector.getMemoryLowerBound() +
         recognitionHandler.getMemoryLowerBound();
}
} // namespace rnexecutorch