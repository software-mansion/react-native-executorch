#include "RecognitionHandler.h"
#include "RecognitionHandlerUtils.h"
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/ocr/Constants.h>
#include <rnexecutorch/models/ocr/RecognitionHandlerUtils.h>

namespace rnexecutorch {

/*
 Recogntion Handler is responsible for:
 1. Preparing the image to be processed by Recognition Model.
 2. Deciding which Recogntion Model is used for each detected bounding box.
 3. Returning the list of tuples (box, text, confidence) to the OCR class.
*/

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
  /*
   Based on the width of image, Recognition Handler
   decides which model to use.
   Note that height of image is always equal to 64.
  */
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
  /*
   Recognition Handler as an arguments accepts bboxesList corresponding to size
   1280x1280, which is desiredSize. imgGray has to be resized (without lose of
   w/h ratio by using padding) to match this size.
  */
  PaddingInfo ratioAndPadding =
      ocr::calculateResizeRatioAndPaddings(imgGray.size(), desiredSize);
  imgGray = imageprocessing::resizePadded(imgGray, desiredSize);

  std::vector<OCRDetection> result = {};
  // Process each individual bounding box
  for (auto &box : bboxesList) {

    /*
     Crop the full image to contain only the part of the bounding box.
     It also resizes the cropped image to have height = 64 (height accepted by
     Recognizer).
    */
    auto croppedImage = ocr::cropImage(box, imgGray, ocr::recognizerHeight);

    if (croppedImage.empty()) {
      continue;
    }

    /*
     Perform the normalization of cropped image for the Recognizer Models.
     In this step, cropped image is resized into the closest of on of three:
     128x64, 256x64, 512x64.
    */
    croppedImage = ocr::normalizeForRecognizer(
        croppedImage, ocr::recognizerHeight, ocr::adjustContrast, false);

    // Run model
    auto [predictionIndices, confidenceScore] = this->runModel(croppedImage);
    /*
     If the confidence score is relatively low, it may be caused by the fact
     that the text is inverted upside down (180 degree rotation).
     We try to flip the cropped image and run the model again.
     We return the better of two results.
    */
    if (confidenceScore < ocr::lowConfidenceThreshold) {
      cv::rotate(croppedImage, croppedImage, cv::ROTATE_180);
      auto [rotatedPredictionIndices, rotatedConfidenceScore] =
          runModel(croppedImage);
      if (rotatedConfidenceScore > confidenceScore) {
        confidenceScore = rotatedConfidenceScore;
        predictionIndices = rotatedPredictionIndices;
      }
    }
    /*
     Since the boxes were corresponding to the image resized to 1280x1280,
     we want to return the boxes shifted and rescaled to match the original
     image dimensions.
    */
    for (auto &point : box.bbox) {
      point.x = (point.x - ratioAndPadding.left) * ratioAndPadding.resizeRatio;
      point.y = (point.y - ratioAndPadding.top) * ratioAndPadding.resizeRatio;
    }
    /*
      In the last step we perform the actual decoding.
      Decoding is obtained by greedy approach.
      For more info see CTCLabelConverter.cpp file.
    */
    result.emplace_back(
        box.bbox,
        converter.decodeGreedy(predictionIndices, predictionIndices.size())[0],
        confidenceScore);
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
