#include "OCR.h"
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/ocr/Constants.h>

namespace rnexecutorch {
OCR::OCR(std::string detectorSource, std::string recognizerSourceLarge,
         std::string recognizerSourceMedium, std::string recognizerSourceSmall,
         std::string symbols, std::shared_ptr<react::CallInvoker> callInvoker)
    : detector(detectorSource, callInvoker),
      recognitionHandler(recognizerSourceLarge, recognizerSourceMedium,
                         recognizerSourceSmall, symbols, callInvoker) {}

std::vector<OCRDetection> OCR::generate(std::string input) {
  cv::Mat image = imageprocessing::readImage(input);
  if (image.empty()) {
    throw std::runtime_error("Failed to load image from path: " + input);
  }

  std::vector<DetectorBBox> bboxesList = detector.generate(image);
  cv::cvtColor(image, image, cv::COLOR_BGR2GRAY);
  std::vector<OCRDetection> result = recognitionHandler.recognize(
      bboxesList, image,
      cv::Size(ocr::recognizerImageSize, ocr::recognizerImageSize));

  return result;
}

std::size_t OCR::getMemoryLowerBound() {
  return detector.getMemoryLowerBound() +
         recognitionHandler.getMemoryLowerBound();
}

} // namespace rnexecutorch