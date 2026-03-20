#pragma once

#include <jsi/jsi.h>
#include <opencv2/opencv.hpp>
#include <rnexecutorch/host_objects/JSTensorViewIn.h>
#include <rnexecutorch/utils/FrameTransform.h>

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
 * @brief Extract a raw RGB cv::Mat from a VisionCamera frameData JSI object.
 *
 * Does not apply any orientation correction — use FrameTransform utilities
 * on the model output to convert coordinates/buffers to screen space.
 * Callers are responsible for any further colour space conversion.
 */
cv::Mat frameToMat(jsi::Runtime &runtime, const jsi::Value &frameData);

/**
 * @brief Read orientation metadata from a VisionCamera frameData JSI object.
 *
 * Reads orientation and isMirrored from the frameData object.
 * Falls back to "up"/false if fields are absent (e.g. when
 * enablePhysicalBufferRotation is used — transform will be a no-op).
 */
FrameOrientation readFrameOrientation(jsi::Runtime &runtime,
                                      const jsi::Value &frameData);

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
