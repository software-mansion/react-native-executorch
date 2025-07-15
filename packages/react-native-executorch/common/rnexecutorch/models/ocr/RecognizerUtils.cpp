#include "RecognizerUtils.h"

namespace rnexecutorch::ocr {
void softmax(cv::Mat &mat) {
  cv::Mat maxVal;
  cv::reduce(mat, maxVal, 1, cv::REDUCE_MAX);
  cv::Mat expandedMax;
  cv::repeat(maxVal, 1, mat.cols, expandedMax);
  mat -= expandedMax;
  cv::exp(mat, mat);
  cv::Mat rowSum;
  cv::reduce(mat, rowSum, 1, cv::REDUCE_SUM);
  cv::repeat(rowSum, 1, mat.cols, expandedMax);
  mat /= expandedMax;
}

std::pair<std::vector<float>, std::vector<int32_t>>
findMaxValuesIndices(const cv::Mat &mat) {
  std::vector<float> maxValues;
  std::vector<int> maxIndices;
  maxValues.reserve(mat.rows);
  maxIndices.reserve(mat.rows);
  for (int row = 0; row < mat.rows; ++row) {
    const float *rowPtr = mat.ptr<float>(row);
    const float *maxIt = std::max_element(rowPtr, rowPtr + mat.cols);
    float maxVal = *maxIt;           // Max value
    int32_t maxIdx = maxIt - rowPtr; // Column index

    maxValues.push_back(maxVal);
    maxIndices.push_back(maxIdx);
  }

  return {maxValues, maxIndices};
}

float confidenceScore(const std::vector<float> &values,
                      const std::vector<int32_t> &indices) {

  //  Filter out values where index is 0 (blank tokens)
  std::vector<float> filteredValues;
  for (int32_t i = 0; i < indices.size(); ++i) {
    if (indices[i] != 0) {
      filteredValues.push_back(values[i]);
    }
  }

  //  If all tokens are blank, return 0
  if (filteredValues.empty()) {
    return 0.0f;
  }

  float product = 1.0f;
  for (float val : filteredValues) {
    product *= val;
  }
  // Confidence Score is slightly modified geometric mean.
  // Geometric mean is not sufficient, because for long texts it scores unfairly
  // low. Reducing the exponent from 1/N -> 2/sqrt(N) makes it less sensitive.
  const float n = static_cast<float>(filteredValues.size());
  const float exponent = 2.0f / std::sqrt(n);
  const float score = std::pow(product, exponent);

  return score;
}
} // namespace rnexecutorch::ocr