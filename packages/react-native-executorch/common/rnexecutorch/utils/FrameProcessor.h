#pragma once

#include <jsi/jsi.h>
#include <opencv2/opencv.hpp>
#include <rnexecutorch/host_objects/JSTensorViewIn.h>

namespace rnexecutorch::utils {

using namespace facebook;

/**
 * @brief Extract cv::Mat from VisionCamera frame data via nativeBuffer
 *
 * Returns an RGB mat (as delivered by the native buffer).
 *
 * @throws RnExecutorchError if nativeBuffer is not present or extraction fails
 * @note The returned cv::Mat does not own the data.
 */
cv::Mat extractFrame(jsi::Runtime &runtime, const jsi::Object &frameData);

/**
 * @brief Convert a VisionCamera frame to a rotated RGB cv::Mat.
 *
 * Handles frame extraction and landscape→portrait rotation.
 * Callers are responsible for any further colour space conversion.
 */
cv::Mat frameToMat(jsi::Runtime &runtime, const jsi::Value &frameData);

/**
 * @brief Validate a JSTensorViewIn and wrap its data in a RGB cv::Mat.
 *
 * Validates sizes (must be [H, W, 3]), scalar type (Byte), and returns a
 * cv::Mat that wraps the raw pixel buffer without copying.
 * Callers are responsible for any further colour space conversion.
 *
 * @throws RnExecutorchError on invalid input
 */
cv::Mat pixelsToMat(const JSTensorViewIn &pixelData);

} // namespace rnexecutorch::utils
