#include "OCR.h"
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/ocr/Constants.h>

namespace rnexecutorch::models::ocr {
OCR::OCR(const std::string &detectorSource,
         const std::string &recognizerSourceLarge,
         const std::string &recognizerSourceMedium,
         const std::string &recognizerSourceSmall, std::string symbols,
         std::shared_ptr<react::CallInvoker> callInvoker)
    : detector(detectorSource, callInvoker),
      recognitionHandler(recognizerSourceLarge, recognizerSourceMedium,
                         recognizerSourceSmall, symbols, callInvoker) {}

std::vector<types::OCRDetection> OCR::generate(std::string input) {
  cv::Mat image = image_processing::readImage(input);
  if (image.empty()) {
    throw std::runtime_error("Failed to load image from path: " + input);
  }

  /*
   1. Detection process returns the list of bounding boxes containing areas
   with text. They are corresponding to the image of size 1280x1280, which
   is a size later used by Recognition Handler.
  */
  std::vector<types::DetectorBBox> bboxesList = detector.generate(image);
  cv::cvtColor(image, image, cv::COLOR_BGR2GRAY);

  /*
   Recognition Handler is responsible for deciding which Recognition model to
   use for each box. It returns the list of tuples; each consisting of:
    - recognized text
    - coordinates of bounding box corresponding to the original image size
    - confidence score
  */
  std::vector<types::OCRDetection> result =
      recognitionHandler.recognize(bboxesList, image,
                                   cv::Size(constants::kRecognizerImageSize,
                                            constants::kRecognizerImageSize));

  return result;
}

std::size_t OCR::getMemoryLowerBound() const noexcept {
  return detector.getMemoryLowerBound() +
         recognitionHandler.getMemoryLowerBound();
}

void OCR::unload() noexcept {
  detector.unload();
  recognitionHandler.unload();
}
} // namespace rnexecutorch::models::ocr
