#pragma once

#include <jsi/jsi.h>
#include <opencv2/opencv.hpp>

namespace rnexecutorch::utils {

using namespace facebook;

/**
 * @brief Extract cv::Mat from VisionCamera frame data via nativeBuffer
 *
 * @param runtime JSI runtime
 * @param frameData JSI object containing frame data from VisionCamera
 *                  Expected properties:
 *                  - nativeBuffer: BigInt pointer to native buffer
 *
 * @return cv::Mat wrapping the frame data (zero-copy)
 *
 * @throws RnExecutorchError if nativeBuffer is not present or extraction fails
 *
 * @note The returned cv::Mat does not own the data.
 *       Caller must ensure the source frame remains valid during use.
 */
cv::Mat extractFrame(jsi::Runtime &runtime, const jsi::Object &frameData);

} // namespace rnexecutorch::utils
