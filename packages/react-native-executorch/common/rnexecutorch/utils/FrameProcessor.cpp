#include "FrameProcessor.h"
#include "FrameExtractor.h"
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>

namespace rnexecutorch::utils {

namespace {

bool hasNativeBuffer(jsi::Runtime &runtime, const jsi::Object &frameData) {
  return frameData.hasProperty(runtime, "nativeBuffer");
}

} // namespace

cv::Mat extractFrame(jsi::Runtime &runtime, const jsi::Object &frameData) {
  if (!hasNativeBuffer(runtime, frameData)) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            "FrameProcessor: No nativeBuffer found in frame");
  }

  auto nativeBufferValue = frameData.getProperty(runtime, "nativeBuffer");
  uint64_t bufferPtr = static_cast<uint64_t>(
      nativeBufferValue.asBigInt(runtime).asUint64(runtime));

  return extractFromNativeBuffer(bufferPtr);
}

cv::Mat frameToMat(jsi::Runtime &runtime, const jsi::Value &frameData) {
  auto frameObj = frameData.asObject(runtime);
  cv::Mat frame = extractFrame(runtime, frameObj);

  // Camera sensors deliver landscape frames; rotate to portrait orientation.
  if (frame.cols > frame.rows) {
    cv::Mat upright;
    cv::rotate(frame, upright, cv::ROTATE_90_CLOCKWISE);
    return upright;
  }
  return frame;
}

cv::Mat pixelsToMat(const JSTensorViewIn &pixelData) {
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
  return cv::Mat(height, width, CV_8UC3, dataPtr);
}

} // namespace rnexecutorch::utils
