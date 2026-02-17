#include "FrameExtractor.h"
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
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
  throw RnExecutorchError(RnExecutorchErrorCode::NotSupported,
                          "NativeBuffer not supported on this platform");
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

  if (pixelFormat == kCVPixelFormatType_32BGRA) {
    // BGRA format (most common on iOS when using pixelFormat: 'rgb')
    mat = cv::Mat(static_cast<int>(height), static_cast<int>(width), CV_8UC4,
                  baseAddress, bytesPerRow);
  } else if (pixelFormat == kCVPixelFormatType_32RGBA) {
    // RGBA format
    mat = cv::Mat(static_cast<int>(height), static_cast<int>(width), CV_8UC4,
                  baseAddress, bytesPerRow);
  } else if (pixelFormat == kCVPixelFormatType_24RGB) {
    // RGB format
    mat = cv::Mat(static_cast<int>(height), static_cast<int>(width), CV_8UC3,
                  baseAddress, bytesPerRow);
  } else {
    CVPixelBufferUnlockBaseAddress(buffer, kCVPixelBufferLock_ReadOnly);
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Unsupported CVPixelBuffer format: %u", pixelFormat);
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            errorMessage);
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
    throw RnExecutorchError(RnExecutorchErrorCode::AccessFailed,
                            "Failed to lock AHardwareBuffer");
  }

  cv::Mat mat;

  if (desc.format == AHARDWAREBUFFER_FORMAT_R8G8B8A8_UNORM) {
    // RGBA format (expected when using pixelFormat: 'rgb' on Android)
    mat = cv::Mat(desc.height, desc.width, CV_8UC4, data, desc.stride * 4);
  } else if (desc.format == AHARDWAREBUFFER_FORMAT_R8G8B8X8_UNORM) {
    // RGBX format (treated as RGBA)
    mat = cv::Mat(desc.height, desc.width, CV_8UC4, data, desc.stride * 4);
  } else if (desc.format == AHARDWAREBUFFER_FORMAT_R8G8B8_UNORM) {
    // RGB format (less common)
    mat = cv::Mat(desc.height, desc.width, CV_8UC3, data, desc.stride * 3);
  } else {
    AHardwareBuffer_unlock(buffer, nullptr);
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Unsupported AHardwareBuffer format: %u", desc.format);
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            errorMessage);
  }

  // Note: We don't unlock here - Vision Camera manages the lifecycle

  return mat;
#else
  throw RnExecutorchError(RnExecutorchErrorCode::NotSupported,
                          "AHardwareBuffer requires Android API 26+");
#endif // __ANDROID_API__ >= 26
}
#endif // __ANDROID__

} // namespace utils
} // namespace rnexecutorch
