#pragma once

#include <opencv2/opencv.hpp>
#include <rnexecutorch/models/ocr/Constants.h>
#include <rnexecutorch/models/ocr/Types.h>
#include <span>

namespace rnexecutorch::ocr {
cv::Mat softmax(const cv::Mat &inputs);

// for each rows of matrix computes{maxValue, index} pair. Returns a list of
// maxValues and a list of corresponding indices.
std::pair<std::vector<float>, std::vector<int32_t>>
findMaxValuesIndices(const cv::Mat &mat);
std::vector<float> sumProbabilityRows(const cv::Mat &matrix);
void divideMatrixByRows(cv::Mat &matrix, const std::vector<float> &rowSums);
cv::Rect extractBoundingBox(const std::array<Point, 4> &points);

// Computes confidence score for given values and indices vectors. Omits blank
// tokens.
float confidenceScore(const std::vector<float> &values,
                      const std::vector<int32_t> &indices);

cv::Mat cropSingleCharacter(const cv::Mat &img);

cv::Mat
cropImageWithBoundingBox(const cv::Mat &img,
                         const std::array<rnexecutorch::Point, 4> &bbox,
                         const std::array<rnexecutorch::Point, 4> &originalBbox,
                         const rnexecutorch::PaddingInfo &paddings,
                         const rnexecutorch::PaddingInfo &originalPaddings);
} // namespace rnexecutorch::ocr
