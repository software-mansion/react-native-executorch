#pragma once

#include <array>
#include <opencv2/opencv.hpp>
#include <rnexecutorch/models/ocr/Constants.h>
#include <rnexecutorch/models/ocr/Types.h>
#include <vector>

namespace rnexecutorch::models::ocr::utils {
/**
 * @brief Computes per row softmax funcion.
 * Formula: softmax(x_i) = exp(x_i - max(x)) / sum(exp(x_j - max(x))) for each
 * row.
 */
cv::Mat softmax(const cv::Mat &inputs);

/**
 * @brief For each row of matrix computes {maxValue, index} pair. Returns a list
 * of maxValues and a list of corresponding indices.
 */
types::ValuesAndIndices findMaxValuesIndices(const cv::Mat &mat);
std::vector<float> sumProbabilityRows(const cv::Mat &matrix);
void divideMatrixByRows(cv::Mat &matrix, const std::vector<float> &rowSums);
cv::Rect extractBoundingBox(std::array<types::Point, 4> &points);

/**
 * @brief Computes confidence score for given values and indices vectors.
 * Omits blank tokens.
 * Formula: pow(\prod_{i=1}^{n}(p_i), 2/sqrt(n)), where n is a number of
 * non-blank tokens, and p_i is the probability of i-th non-blank token.
 * @details Formula derived from line 14 of
 * https://github.com/JaidedAI/EasyOCR/blob/c4f3cd7225efd4f85451bd8b4a7646ae9a092420/easyocr/recognition.py#L14
 * @details 'Some say that it's a code, sent to us from god'
 */
float confidenceScore(const std::vector<float> &values,
                      const std::vector<int32_t> &indices);

cv::Mat characterBitMask(const cv::Mat &img);

/**
 * @brief Perform cropping of an image to a single character detector box.
 * This function utilizes info about external bounding box and padding combined
 * with internal bounding box and padding.
 * It does so to preserve the best possible image quality.
 */
cv::Mat
cropImageWithBoundingBox(const cv::Mat &img,
                         const std::array<types::Point, 4> &bbox,
                         const std::array<types::Point, 4> &originalBbox,
                         const types::PaddingInfo &paddings,
                         const types::PaddingInfo &originalPaddings);

/**
 * @brief Perform cropping, resizing and convert to grayscale to prepare image
 * for Recognizer.
 *
 * Prepare for Recognition by following steps:
 * 1. Crop image to the character bounding box,
 * 2. Convert Image to gray.
 * 3. Resize it to [kSmallVerticalRecognizerWidth x kRecognizerHeight] (64 x
 * 64).
 *
 * @details it utilizes cropImageWithBoundingBox to perform specific cropping.
 */

cv::Mat prepareForRecognition(const cv::Mat &originalImage,
                              const std::array<types::Point, 4> &bbox,
                              const std::array<types::Point, 4> &originalBbox,
                              const types::PaddingInfo &paddings,
                              const types::PaddingInfo &originalPaddings);
} // namespace rnexecutorch::models::ocr::utils
