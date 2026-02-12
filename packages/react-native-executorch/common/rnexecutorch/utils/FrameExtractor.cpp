#include "FrameExtractor.h"
#include <rnexecutorch/Log.h>

#ifdef __APPLE__
#import <CoreVideo/CoreVideo.h>
#endif

#ifdef __ANDROID__
#if __ANDROID_API__ >= 26
#include <android/hardware_buffer.h>
#endif
#endif

namespace rnexecutorch {
namespace utils {

cv::Mat FrameExtractor::extractFromNativeBuffer(uint64_t bufferPtr) {
#ifdef __APPLE__
  return extractFromCVPixelBuffer(reinterpret_cast<void *>(bufferPtr));
#elif defined(__ANDROID__)
  return extractFromAHardwareBuffer(reinterpret_cast<void *>(bufferPtr));
#else
  throw std::runtime_error("NativeBuffer not supported on this platform");
#endif
}

#ifdef __APPLE__
cv::Mat FrameExtractor::extractFromCVPixelBuffer(void *pixelBuffer) {
  CVPixelBufferRef buffer = static_cast<CVPixelBufferRef>(pixelBuffer);

  // Get buffer properties
  size_t width = CVPixelBufferGetWidth(buffer);
  size_t height = CVPixelBufferGetHeight(buffer);
  size_t bytesPerRow = CVPixelBufferGetBytesPerRow(buffer);
  OSType pixelFormat = CVPixelBufferGetPixelFormatType(buffer);

  // Lock the buffer (Vision Camera should have already locked it, but ensure)
  CVPixelBufferLockBaseAddress(buffer, kCVPixelBufferLock_ReadOnly);
  void *baseAddress = CVPixelBufferGetBaseAddress(buffer);

  cv::Mat mat;

  // Log pixel format once for debugging
  static bool loggedPixelFormat = false;
  if (!loggedPixelFormat) {
    log(LOG_LEVEL::Debug, "CVPixelBuffer format code: ", pixelFormat);
    loggedPixelFormat = true;
  }

  if (pixelFormat == kCVPixelFormatType_32BGRA) {
    // BGRA format (most common on iOS when using pixelFormat: 'rgb')
    if (!loggedPixelFormat) {
      log(LOG_LEVEL::Debug, "Extracting from CVPixelBuffer: BGRA format, ",
          width, "x", height, ", stride: ", bytesPerRow);
    }
    mat = cv::Mat(static_cast<int>(height), static_cast<int>(width), CV_8UC4,
                  baseAddress, bytesPerRow);
  } else if (pixelFormat == kCVPixelFormatType_32RGBA) {
    // RGBA format
    if (!loggedPixelFormat) {
      log(LOG_LEVEL::Debug, "Extracting from CVPixelBuffer: RGBA format, ",
          width, "x", height, ", stride: ", bytesPerRow);
    }
    mat = cv::Mat(static_cast<int>(height), static_cast<int>(width), CV_8UC4,
                  baseAddress, bytesPerRow);
  } else if (pixelFormat == kCVPixelFormatType_24RGB) {
    // RGB format
    if (!loggedPixelFormat) {
      log(LOG_LEVEL::Debug, "Extracting from CVPixelBuffer: RGB format, ",
          width, "x", height, ", stride: ", bytesPerRow);
    }
    mat = cv::Mat(static_cast<int>(height), static_cast<int>(width), CV_8UC3,
                  baseAddress, bytesPerRow);
  } else {
    CVPixelBufferUnlockBaseAddress(buffer, kCVPixelBufferLock_ReadOnly);
    throw std::runtime_error("Unsupported CVPixelBuffer format: " +
                             std::to_string(pixelFormat));
  }

  // Note: We don't unlock here - Vision Camera manages the lifecycle
  // When frame.dispose() is called, Vision Camera will unlock and release

  return mat;
}
#endif

#ifdef __ANDROID__
cv::Mat FrameExtractor::extractFromAHardwareBuffer(void *hardwareBuffer) {
#if __ANDROID_API__ >= 26
  AHardwareBuffer *buffer = static_cast<AHardwareBuffer *>(hardwareBuffer);

  // Get buffer description
  AHardwareBuffer_Desc desc;
  AHardwareBuffer_describe(buffer, &desc);

  // Lock the buffer for CPU read access
  void *data = nullptr;
  int lockResult = AHardwareBuffer_lock(
      buffer, AHARDWAREBUFFER_USAGE_CPU_READ_OFTEN, -1, nullptr, &data);

  if (lockResult != 0) {
    throw std::runtime_error("Failed to lock AHardwareBuffer");
  }

  cv::Mat mat;

  // Log format once for debugging
  static bool loggedFormat = false;
  if (!loggedFormat) {
    log(LOG_LEVEL::Debug, "AHardwareBuffer format code: ", desc.format);
    loggedFormat = true;
  }

  if (desc.format == AHARDWAREBUFFER_FORMAT_R8G8B8A8_UNORM) {
    // RGBA format (expected when using pixelFormat: 'rgb' on Android)
    if (!loggedFormat) {
      log(LOG_LEVEL::Debug, "Extracting from AHardwareBuffer: RGBA format, ",
          desc.width, "x", desc.height, ", stride: ", desc.stride * 4);
    }
    mat = cv::Mat(desc.height, desc.width, CV_8UC4, data, desc.stride * 4);
  } else if (desc.format == AHARDWAREBUFFER_FORMAT_R8G8B8X8_UNORM) {
    // RGBX format (treated as RGBA)
    if (!loggedFormat) {
      log(LOG_LEVEL::Debug, "Extracting from AHardwareBuffer: RGBX format, ",
          desc.width, "x", desc.height, ", stride: ", desc.stride * 4);
    }
    mat = cv::Mat(desc.height, desc.width, CV_8UC4, data, desc.stride * 4);
  } else if (desc.format == AHARDWAREBUFFER_FORMAT_R8G8B8_UNORM) {
    // RGB format (less common)
    if (!loggedFormat) {
      log(LOG_LEVEL::Debug, "Extracting from AHardwareBuffer: RGB format, ",
          desc.width, "x", desc.height, ", stride: ", desc.stride * 3);
    }
    mat = cv::Mat(desc.height, desc.width, CV_8UC3, data, desc.stride * 3);
  } else {
    AHardwareBuffer_unlock(buffer, nullptr);
    throw std::runtime_error("Unsupported AHardwareBuffer format: " +
                             std::to_string(desc.format));
  }

  // Note: We don't unlock here - Vision Camera manages the lifecycle

  return mat;
#else
  throw std::runtime_error("AHardwareBuffer requires Android API 26+");
#endif // __ANDROID_API__ >= 26
}
#endif // __ANDROID__

} // namespace utils
} // namespace rnexecutorch
