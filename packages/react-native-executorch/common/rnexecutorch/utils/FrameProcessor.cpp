#include "FrameProcessor.h"
#include "FrameExtractor.h"
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/Log.h>

namespace rnexecutorch {
namespace utils {

cv::Mat FrameProcessor::extractFrame(jsi::Runtime &runtime,
                                     const jsi::Object &frameData) {
  // Get frame dimensions
  int width =
      static_cast<int>(frameData.getProperty(runtime, "width").asNumber());
  int height =
      static_cast<int>(frameData.getProperty(runtime, "height").asNumber());

  // Try zero-copy path first (nativeBuffer)
  if (hasNativeBuffer(runtime, frameData)) {
    try {
      return extractFromNativeBuffer(runtime, frameData);
    } catch (const std::exception &e) {
      // Fallback to ArrayBuffer on failure
    }
  }

  // Fallback to ArrayBuffer path (with copy)
  if (frameData.hasProperty(runtime, "data")) {
    return extractFromArrayBuffer(runtime, frameData, width, height);
  }

  // No valid frame data source
  throw RnExecutorchError(
      RnExecutorchErrorCode::InvalidUserInput,
      "FrameProcessor: No valid frame data (neither nativeBuffer nor data "
      "property found)");
}

cv::Size FrameProcessor::getFrameSize(jsi::Runtime &runtime,
                                      const jsi::Object &frameData) {
  if (!frameData.hasProperty(runtime, "width") ||
      !frameData.hasProperty(runtime, "height")) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidUserInput,
        "FrameProcessor: Frame data missing width or height property");
  }

  int width =
      static_cast<int>(frameData.getProperty(runtime, "width").asNumber());
  int height =
      static_cast<int>(frameData.getProperty(runtime, "height").asNumber());

  return cv::Size(width, height);
}

bool FrameProcessor::hasNativeBuffer(jsi::Runtime &runtime,
                                     const jsi::Object &frameData) {
  return frameData.hasProperty(runtime, "nativeBuffer");
}

cv::Mat FrameProcessor::extractFromNativeBuffer(jsi::Runtime &runtime,
                                                const jsi::Object &frameData) {
  auto nativeBufferValue = frameData.getProperty(runtime, "nativeBuffer");

  // Handle bigint pointer value from JavaScript
  uint64_t bufferPtr = static_cast<uint64_t>(
      nativeBufferValue.asBigInt(runtime).asUint64(runtime));

  // Use FrameExtractor to get cv::Mat from platform-specific buffer
  // Native buffer contains all metadata (width, height, format)
  return FrameExtractor::extractFromNativeBuffer(bufferPtr);
}

cv::Mat FrameProcessor::extractFromArrayBuffer(jsi::Runtime &runtime,
                                               const jsi::Object &frameData,
                                               int width, int height) {
  auto pixelData = frameData.getProperty(runtime, "data");
  auto arrayBuffer = pixelData.asObject(runtime).getArrayBuffer(runtime);
  uint8_t *data = arrayBuffer.data(runtime);
  size_t bufferSize = arrayBuffer.size(runtime);

  // Determine format based on buffer size
  size_t stride = bufferSize / height;
  size_t expectedRGBAStride = width * 4;
  size_t expectedRGBStride = width * 3;

  if (stride == expectedRGBAStride || bufferSize >= width * height * 4) {
    // RGBA format with potential padding
    return cv::Mat(height, width, CV_8UC4, data, stride);
  } else if (stride >= expectedRGBStride) {
    // RGB format
    return cv::Mat(height, width, CV_8UC3, data, stride);
  } else {
    char errorMessage[200];
    std::snprintf(
        errorMessage, sizeof(errorMessage),
        "FrameProcessor: Unexpected buffer size - expected %zu or %zu bytes "
        "per row, got %zu",
        expectedRGBStride, expectedRGBAStride, stride);
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            errorMessage);
  }
}

} // namespace utils
} // namespace rnexecutorch
