#include "OCR.h"

#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/ocr/Constants.h>
namespace rnexecutorch
{
  OCR::OCR(std::string detectorSource, std::string recognizerSourceLarge,
           std::string recognizerSourceMedium, std::string recognizerSourceSmall,
           std::string symbols, std::shared_ptr<react::CallInvoker> callInvoker)
      : detector(detectorSource, callInvoker),
        recognitionHandler(symbols, recognizerSourceLarge, recognizerSourceMedium,
                           recognizerSourceSmall, callInvoker)
  {
    log(LOG_LEVEL::Info, "running!");
  }

  std::vector<OCRDetection> OCR::generate(std::string input)
  {
    log(LOG_LEVEL::Info, "generating!");
    std::vector<DetectorBBox> detectorResult = detector.generate(input);
    cv::Mat grayscaleImg = imageprocessing::readImage(input);
    cv::cvtColor(grayscaleImg, grayscaleImg, cv::COLOR_BGR2GRAY);
    std::vector<OCRDetection> result = recognitionHandler.recognize(
        detectorResult, grayscaleImg,
        cv::Size(ocr::recognizerImageSize, ocr::recognizerImageSize));
    return result;
  }

  void OCR::unload()
  {
    detector.unload();
    recognitionHandler.unload();
  }

  std::size_t OCR::getMemoryLowerBound()
  {
    return detector.getMemoryLowerBound() +
           recognitionHandler.getMemoryLowerBound();
  }
} // namespace rnexecutorch