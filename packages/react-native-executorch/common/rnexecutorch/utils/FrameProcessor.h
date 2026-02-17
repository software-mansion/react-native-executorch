#pragma once

#include <jsi/jsi.h>
#include <opencv2/opencv.hpp>

namespace rnexecutorch {
namespace utils {

using namespace facebook;

/**
 * @brief Utility class for processing camera frames from VisionCamera
 *
 * Provides high-level helpers for extracting and working with frames from
 * react-native-vision-camera in a consistent way across all vision models.
 *
 * This class abstracts away the complexity of:
 * - Handling both nativeBuffer (zero-copy) and ArrayBuffer (with copy) paths
 * - Platform-specific buffer formats (CVPixelBuffer on iOS, AHardwareBuffer
 * on Android)
 * - JSI object property access and type conversions
 *
 * Usage:
 * @code
 * auto frameObj = frameData.asObject(runtime);
 * cv::Mat frame = FrameProcessor::extractFrame(runtime, frameObj);
 * cv::Size size = FrameProcessor::getFrameSize(runtime, frameObj);
 * @endcode
 */
class FrameProcessor {
public:
  /**
   * @brief Extract cv::Mat from VisionCamera frame data
   *
   * Handles both zero-copy (nativeBuffer) and copy-based (ArrayBuffer) paths
   * automatically. Prefers nativeBuffer when available for best performance.
   *
   * @param runtime JSI runtime
   * @param frameData JSI object containing frame data from VisionCamera
   *                  Expected properties:
   *                  - nativeBuffer (optional): BigInt pointer to native buffer
   *                  - data (optional): ArrayBuffer with pixel data
   *                  - width: number
   *                  - height: number
   *
   * @return cv::Mat wrapping or containing the frame data
   *
   * @throws RnExecutorchError if neither nativeBuffer nor data is available
   * @throws RnExecutorchError if nativeBuffer extraction fails
   *
   * @note The returned cv::Mat may not own the data (zero-copy path).
   *       Caller must ensure the source frame remains valid during use.
   */
  static cv::Mat extractFrame(jsi::Runtime &runtime,
                              const jsi::Object &frameData);

  /**
   * @brief Get frame dimensions from VisionCamera frame data
   *
   * @param runtime JSI runtime
   * @param frameData JSI object containing frame data
   *
   * @return cv::Size with frame width and height
   *
   * @throws RnExecutorchError if width or height properties are missing
   */
  static cv::Size getFrameSize(jsi::Runtime &runtime,
                               const jsi::Object &frameData);

  /**
   * @brief Check if frame data has nativeBuffer (zero-copy path available)
   *
   * @param runtime JSI runtime
   * @param frameData JSI object containing frame data
   * @return true if nativeBuffer is available, false otherwise
   */
  static bool hasNativeBuffer(jsi::Runtime &runtime,
                              const jsi::Object &frameData);

private:
  /**
   * @brief Extract frame from nativeBuffer pointer (zero-copy)
   *
   * Native buffer contains all metadata (width, height, format), so no need to
   * pass dimensions separately.
   *
   * @param runtime JSI runtime
   * @param frameData JSI object with nativeBuffer property
   * @return cv::Mat wrapping the native buffer data
   */
  static cv::Mat extractFromNativeBuffer(jsi::Runtime &runtime,
                                         const jsi::Object &frameData);

  /**
   * @brief Extract frame from ArrayBuffer (with copy)
   *
   * @param runtime JSI runtime
   * @param frameData JSI object with data property
   * @param width Frame width
   * @param height Frame height
   * @return cv::Mat containing or wrapping the array buffer data
   */
  static cv::Mat extractFromArrayBuffer(jsi::Runtime &runtime,
                                        const jsi::Object &frameData, int width,
                                        int height);
};

} // namespace utils
} // namespace rnexecutorch
