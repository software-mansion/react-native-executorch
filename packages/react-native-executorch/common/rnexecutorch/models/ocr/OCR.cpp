#include "OCR.h"
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/ocr/Constants.h>

namespace rnexecutorch {

/*
 The OCR consists of two phases:
 1. Detection - detecting text regions in the image, the result of this phase
 is a list of bounding boxes.
 2. Recognition - recognizing the text in the bounding boxes, the result is a
 list of strings and corresponding boxes & confidence scores.

 Recognition uses three models, each model is resposible for recognizing text
 of different sizes (e.g. large - 512x64, medium - 256x64, small - 128x64).
*/

OCR::OCR(const std::string &detectorSource,
         const std::string &recognizerSourceLarge,
         const std::string &recognizerSourceMedium,
         const std::string &recognizerSourceSmall, std::string symbols,
         std::shared_ptr<react::CallInvoker> callInvoker)
    : detector(detectorSource, callInvoker),
      recognitionHandler(recognizerSourceLarge, recognizerSourceMedium,
                         recognizerSourceSmall, symbols, callInvoker) {}

std::vector<OCRDetection> OCR::generate(std::string input) {
  cv::Mat image = imageprocessing::readImage(input);
  if (image.empty()) {
    throw std::runtime_error("Failed to load image from path: " + input);
  }

  /*
   1. Detection process returns the list of bounding boxes containing areas
   with text. They are corresponding to the image of size 1280x1280, which
   which is a size later used by Recognition Handler.
  */
  std::vector<DetectorBBox> bboxesList = detector.generate(image);

  /*
   Recognition always works on the grayscale images, therefore the change is
   needed.
  */
  cv::cvtColor(image, image, cv::COLOR_BGR2GRAY);

  /*
   Recognition Handler is responsible for deciding which Recognition model to
   use for each box. It returns the list of tuples; each consisting of:
    - recognized text
    - coordinates of bounding box corresponding to the original image size
    - confidence score
  */
  std::vector<OCRDetection> result = recognitionHandler.recognize(
      bboxesList, image,
      cv::Size(ocr::recognizerImageSize, ocr::recognizerImageSize));

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
} // namespace rnexecutorch
