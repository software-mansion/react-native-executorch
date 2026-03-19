#include "OCR.h"
#include "Constants.h"
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/ocr/Constants.h>
#include <rnexecutorch/utils/FrameProcessor.h>

namespace rnexecutorch::models::ocr {
OCR::OCR(const std::string &detectorSource, const std::string &recognizerSource,
         const std::string &symbols,
         std::shared_ptr<react::CallInvoker> callInvoker)
    : detector(detectorSource, callInvoker),
      recognitionHandler(recognizerSource, symbols, callInvoker) {}

std::vector<types::OCRDetection> OCR::runInference(cv::Mat image) {
  std::scoped_lock lock(inference_mutex_);

  /*
   1. Detection process returns the list of bounding boxes containing areas
   with text. They are corresponding to the image of size 1280x1280, which
   is a size later used by Recognition Handler.
  */
  std::vector<types::DetectorBBox> bboxesList =
      detector.generate(image, constants::kMediumDetectorWidth);
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

std::vector<types::OCRDetection> OCR::generateFromString(std::string input) {
  cv::Mat image = image_processing::readImage(input);
  if (image.empty()) {
    throw RnExecutorchError(RnExecutorchErrorCode::FileReadFailed,
                            "Failed to load image from path: " + input);
  }
  return runInference(image);
}

std::vector<types::OCRDetection>
OCR::generateFromFrame(jsi::Runtime &runtime, const jsi::Value &frameData) {
  auto orient = ::rnexecutorch::utils::readFrameOrientation(runtime, frameData);
  cv::Mat frame = ::rnexecutorch::utils::frameToMat(runtime, frameData);
  cv::Mat bgr;
#ifdef __APPLE__
  cv::cvtColor(frame, bgr, cv::COLOR_BGRA2BGR);
#elif defined(__ANDROID__)
  cv::cvtColor(frame, bgr, cv::COLOR_RGBA2BGR);
#else
  throw RnExecutorchError(
      RnExecutorchErrorCode::PlatformNotSupported,
      "generateFromFrame is not supported on this platform");
#endif
  cv::Mat rotated = ::rnexecutorch::utils::rotateFrameForModel(bgr, orient);
  auto detections = runInference(rotated);
  for (auto &det : detections) {
    ::rnexecutorch::utils::inverseRotatePoints(det.bbox, orient,
                                               rotated.cols, rotated.rows);
  }
  return detections;
}

std::vector<types::OCRDetection>
OCR::generateFromPixels(JSTensorViewIn pixelData) {
  cv::Mat image;
  cv::cvtColor(::rnexecutorch::utils::pixelsToMat(pixelData), image,
               cv::COLOR_RGB2BGR);
  return runInference(image);
}

std::size_t OCR::getMemoryLowerBound() const noexcept {
  return detector.getMemoryLowerBound() +
         recognitionHandler.getMemoryLowerBound();
}

void OCR::unload() noexcept {
  std::scoped_lock lock(inference_mutex_);
  detector.unload();
  recognitionHandler.unload();
}
} // namespace rnexecutorch::models::ocr
