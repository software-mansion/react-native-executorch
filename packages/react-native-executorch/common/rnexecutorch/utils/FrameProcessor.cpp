#include "FrameProcessor.h"
#include "FrameExtractor.h"
#include <rnexecutorch/Log.h>
#include <stdexcept>

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
    static bool loggedPath = false;
    if (!loggedPath) {
      log(LOG_LEVEL::Debug, "FrameProcessor: Using zero-copy nativeBuffer");
      loggedPath = true;
    }

    try {
      return extractFromNativeBuffer(runtime, frameData, width, height);
    } catch (const std::exception &e) {
      log(LOG_LEVEL::Debug,
          "FrameProcessor: nativeBuffer extraction failed: ", e.what());
      log(LOG_LEVEL::Debug, "FrameProcessor: Falling back to ArrayBuffer");
    }
  }

  // Fallback to ArrayBuffer path (with copy)
  if (frameData.hasProperty(runtime, "data")) {
    static bool loggedPath = false;
    if (!loggedPath) {
      log(LOG_LEVEL::Debug, "FrameProcessor: Using ArrayBuffer (with copy)");
      loggedPath = true;
    }

    return extractFromArrayBuffer(runtime, frameData, width, height);
  }

  // No valid frame data source
  throw std::runtime_error(
      "FrameProcessor: No valid frame data (neither nativeBuffer nor data "
      "property found)");
}

cv::Size FrameProcessor::getFrameSize(jsi::Runtime &runtime,
                                      const jsi::Object &frameData) {
  if (!frameData.hasProperty(runtime, "width") ||
      !frameData.hasProperty(runtime, "height")) {
    throw std::runtime_error("FrameProcessor: Frame data missing width or "
                             "height property");
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
                                                const jsi::Object &frameData,
                                                int width, int height) {
  auto nativeBufferValue = frameData.getProperty(runtime, "nativeBuffer");

  // Handle bigint pointer value from JavaScript
  uint64_t bufferPtr = static_cast<uint64_t>(
      nativeBufferValue.asBigInt(runtime).asUint64(runtime));

  // Use FrameExtractor to get cv::Mat from platform-specific buffer
  cv::Mat frame = FrameExtractor::extractFromNativeBuffer(bufferPtr);

  // Validate extracted frame dimensions match expected
  if (frame.cols != width || frame.rows != height) {
    log(LOG_LEVEL::Debug, "FrameProcessor: Dimension mismatch - expected ",
        width, "x", height, " but got ", frame.cols, "x", frame.rows);
  }

  return frame;
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

  cv::Mat frame;

  if (stride == expectedRGBAStride || bufferSize >= width * height * 4) {
    // RGBA format with potential padding
    frame = cv::Mat(height, width, CV_8UC4, data, stride);

    static bool loggedFormat = false;
    if (!loggedFormat) {
      log(LOG_LEVEL::Debug,
          "FrameProcessor: ArrayBuffer format is RGBA, "
          "stride: ",
          stride);
      loggedFormat = true;
    }
  } else if (stride >= expectedRGBStride) {
    // RGB format
    frame = cv::Mat(height, width, CV_8UC3, data, stride);

    static bool loggedFormat = false;
    if (!loggedFormat) {
      log(LOG_LEVEL::Debug,
          "FrameProcessor: ArrayBuffer format is RGB, stride: ", stride);
      loggedFormat = true;
    }
  } else {
    throw std::runtime_error(
        "FrameProcessor: Unexpected buffer size - expected " +
        std::to_string(expectedRGBStride) + " or " +
        std::to_string(expectedRGBAStride) + " bytes per row, got " +
        std::to_string(stride));
  }

  return frame;
}

} // namespace utils
} // namespace rnexecutorch
