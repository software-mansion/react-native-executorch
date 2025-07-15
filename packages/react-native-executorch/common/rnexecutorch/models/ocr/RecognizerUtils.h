#pragma once

#include <span>

#include <opencv2/opencv.hpp>

#include <rnexecutorch/models/ocr/Types.h>

namespace rnexecutorch::ocr {
// Computes  in-place per-row softmax for given Matrix.
// The softmax function can be also found in
// common/rnexecutorch/data_processing/Numerical.cpp, however since in
// Recognition usage of cv::Matrix is more convienient I've decided to implement
// it again in a way that fits my purposes.
void softmax(cv::Mat &mat);

// for each rows of matrix computes{maxValue, index} pair. Returns a list of
// maxValues and a list of corresponding indices.
std::pair<std::vector<float>, std::vector<int32_t>>
findMaxValuesIndices(const cv::Mat &mat);

// Computes confidence score for given values and indices vectors. Omits blank
// tokens.
float confidenceScore(const std::vector<float> &values,
                      const std::vector<int32_t> &indices);
} // namespace rnexecutorch::ocr