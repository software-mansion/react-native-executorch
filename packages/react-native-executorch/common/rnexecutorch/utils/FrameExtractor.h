#pragma once

#include <cstdint>
#include <opencv2/opencv.hpp>

namespace rnexecutorch::utils {

/**
 * @brief Extract cv::Mat from a native platform buffer pointer (zero-copy)
 *
 * Dispatches to the platform-specific implementation:
 * - iOS: CVPixelBufferRef
 * - Android: AHardwareBuffer
 *
 * @param bufferPtr Platform-specific buffer pointer (uint64_t)
 * @return cv::Mat wrapping the buffer data (zero-copy)
 *
 * @throws RnExecutorchError if the platform is unsupported or extraction fails
 *
 * @note The returned cv::Mat does not own the data.
 *       Caller must ensure the buffer remains valid during use.
 */
cv::Mat extractFromNativeBuffer(uint64_t bufferPtr);

} // namespace rnexecutorch::utils
