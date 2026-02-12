#pragma once

#include <cstdint>
#include <opencv2/opencv.hpp>

namespace rnexecutorch {
namespace utils {

/**
 * @brief Utility class for extracting cv::Mat from native platform buffers
 *
 * Provides zero-copy extraction of frames from:
 * - iOS: CVPixelBufferRef
 * - Android: AHardwareBuffer
 */
class FrameExtractor {
public:
  /**
   * @brief Extract cv::Mat from a native buffer pointer
   *
   * @param bufferPtr Platform-specific buffer pointer (uint64_t)
   *                  - iOS: CVPixelBufferRef
   *                  - Android: AHardwareBuffer*
   * @return cv::Mat wrapping the buffer data (zero-copy)
   *
   * @note The returned cv::Mat does not own the data.
   *       The caller must ensure the buffer remains valid.
   * @note The buffer must be locked before calling and unlocked after use.
   */
  static cv::Mat extractFromNativeBuffer(uint64_t bufferPtr);

#ifdef __APPLE__
  /**
   * @brief Extract cv::Mat from CVPixelBuffer (iOS)
   *
   * @param pixelBuffer CVPixelBufferRef pointer
   * @return cv::Mat wrapping the pixel buffer data
   *
   * @note Assumes buffer is already locked by Vision Camera
   * @note Supports kCVPixelFormatType_32BGRA and kCVPixelFormatType_24RGB
   */
  static cv::Mat extractFromCVPixelBuffer(void *pixelBuffer);
#endif

#ifdef __ANDROID__
  /**
   * @brief Extract cv::Mat from AHardwareBuffer (Android)
   *
   * @param hardwareBuffer AHardwareBuffer* pointer
   * @return cv::Mat wrapping the hardware buffer data
   *
   * @note Assumes buffer is already locked by Vision Camera
   * @note Supports AHARDWAREBUFFER_FORMAT_R8G8B8A8_UNORM and R8G8B8_UNORM
   */
  static cv::Mat extractFromAHardwareBuffer(void *hardwareBuffer);
#endif
};

} // namespace utils
} // namespace rnexecutorch
