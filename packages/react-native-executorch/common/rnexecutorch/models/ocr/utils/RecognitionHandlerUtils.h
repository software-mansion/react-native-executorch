#pragma once

#include <opencv2/opencv.hpp>
#include <rnexecutorch/models/ocr/Types.h>

namespace rnexecutorch::models::ocr::utils {
/**
 * @brief Calculates the resize ratio and padding offsets needed to fit an image
 *  into a target size while maintaining aspect ratio.
 * @param size Original dimensions of the image.
 * @param desiredSize Target size.
 * @return Struct containing the scaling factor and top/left padding amounts for
 * centering the image.
 */
types::PaddingInfo calculateResizeRatioAndPaddings(cv::Size size,
                                                   cv::Size desiredSize);
/**
 * @brief Resizes an image proportionally to match a target height while
 * maintaining aspect ratio.
 * @param img Input/output image to resize.
 * @param size Original dimensions of the image.
 * @param modelHeight Target height for the output image.
 */
void computeRatioAndResize(cv::Mat &img, cv::Size size, int32_t modelHeight);
/**
 * @brief Crops and aligns a rotated bounding box region from an image, then
 * resizes it to target height.
 *
 * Handles rotated boxes by:
 * 1. Calculating minimum area rectangle around detected points
 * 2. Rotating the entire image to align the box horizontally
 * 3. Transforming the box coordinates to match the rotated image
 * 4. Cropping the aligned region
 *
 * Resizing:
 * - Maintains original aspect ratio while scaling to specified modelHeight
 * - Uses high-quality interpolation for both rotation and resizing
 *
 * @param box Detected bounding box with rotation angle and corner points
 * @param image Source image to crop from
 * @param modelHeight Target height for output (width scales proportionally)
 * @return Cropped, aligned and resized image region (empty if invalid box)
 */
cv::Mat cropImage(types::DetectorBBox box, cv::Mat &image, int32_t modelHeight);
void adjustContrastGrey(cv::Mat &img, double target);
/**
 * @brief Prepares an image for recognition models by standardizing size,
 * contrast, and pixel values.
 *
 * Performs the following processing pipeline:
 * 1. Adjusts contrast (if coefficient > 0)
 * 2. Resizes to target height while:
 *    - Preserving aspect ratio (using padding if needed)
 *    - Selecting width to match one of the Recognizer accepted
 *      widths; (Large,Medium or Small RecognizerWidth)
 * 3. Normalizes pixel values to [-1, 1] range (from [0,255] input)
 *
 * @param image Input image to process (any size, will be cloned)
 * @param modelHeight Target output height in pixels
 * @param adjustContrast Contrast adjustment coefficient (0.0 = no adjustment)
 * @param isVertical Whether the image is in portrait orientation (affects width
 * selection)
 *
 * @return Processed image with:
 *   - Standardized dimensions (selected width × modelHeight)
 *   - Adjusted contrast (if requested)
 *   - Normalized float32 values in [-1, 1] range
 */
cv::Mat normalizeForRecognizer(const cv::Mat &image, int32_t modelHeight,
                               double adjustContrast = 0.0,
                               bool isVertical = false);
} // namespace rnexecutorch::models::ocr::utils
