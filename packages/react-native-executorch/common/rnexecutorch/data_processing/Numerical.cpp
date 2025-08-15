#include "Numerical.h"

#include <algorithm>
#include <cmath>
#include <numeric>
#include <span>

namespace rnexecutorch::numerical {
void softmax(std::vector<float> &v) {
  float max = *std::max_element(v.begin(), v.end());

  float sum = 0.0f;
  for (float &x : v) {
    x = std::exp(x - max);
    sum += x;
  }
  for (float &x : v) {
    x /= sum;
  }
}

void normalize(std::span<float> span) {
  auto sum = 0.0f;
  for (const auto &val : span) {
    sum += val * val;
  }

  if (isClose(sum, 0.0f)) {
    return;
  }

  float norm = std::sqrt(sum);
  for (auto &val : span) {
    val /= norm;
  }
}

void normalize(std::vector<float> &v) {
  float sum = 0.0f;
  for (float &x : v) {
    sum += x * x;
  }

  float norm =
      std::max(std::sqrt(sum), 1e-9f); // Solely for preventing division by 0
  for (float &x : v) {
    x /= norm;
  }
}

std::vector<float> meanPooling(std::span<const float> modelOutput,
                               std::span<const int64_t> attnMask) {
  auto attnMaskLength = attnMask.size();
  auto embeddingDim = modelOutput.size() / attnMaskLength;

  float maskSum = 0;
  for (const auto &v : attnMask) {
    maskSum += static_cast<float>(v);
  }
  maskSum = std::max(maskSum, 1e-9f);

  auto result = std::vector<float>();
  result.reserve(embeddingDim);
  for (size_t i = 0; i < embeddingDim; i++) {
    float dimensionSum = 0;
    for (size_t j = 0; j < attnMaskLength; j++) {
      dimensionSum +=
          modelOutput[j * embeddingDim + i] * static_cast<float>(attnMask[j]);
    }
    result.push_back(dimensionSum / maskSum);
  }
  return result;
}

template <typename T> bool isClose(T a, T b, T atol) {
  return std::abs(a - b) <= atol;
}

template bool isClose<float>(float, float, float);
template bool isClose<double>(double, double, double);

} // namespace rnexecutorch::numerical