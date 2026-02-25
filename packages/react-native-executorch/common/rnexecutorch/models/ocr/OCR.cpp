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
  auto frameObj = frameData.asObject(runtime);
  cv::Mat frame = ::rnexecutorch::utils::extractFrame(runtime, frameObj);
  // extractFrame returns RGB; convert to BGR for consistency with readImage
  cv::cvtColor(frame, frame, cv::COLOR_RGB2BGR);
  return runInference(frame);
}

std::vector<types::OCRDetection>
OCR::generateFromPixels(JSTensorViewIn pixelData) {
  if (pixelData.sizes.size() != 3) {
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Invalid pixel data: sizes must have 3 elements "
                  "[height, width, channels], got %zu",
                  pixelData.sizes.size());
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            errorMessage);
  }

  int32_t height = pixelData.sizes[0];
  int32_t width = pixelData.sizes[1];
  int32_t channels = pixelData.sizes[2];

  if (channels != 3) {
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Invalid pixel data: expected 3 channels (RGB), got %d",
                  channels);
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            errorMessage);
  }

  if (pixelData.scalarType != executorch::aten::ScalarType::Byte) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidUserInput,
        "Invalid pixel data: scalarType must be BYTE (Uint8Array)");
  }

  uint8_t *dataPtr = static_cast<uint8_t *>(pixelData.dataPtr);
  // Input is RGB from JS; convert to BGR for consistency with readImage
  cv::Mat rgbImage(height, width, CV_8UC3, dataPtr);
  cv::Mat image;
  cv::cvtColor(rgbImage, image, cv::COLOR_RGB2BGR);
  return runInference(image);
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
