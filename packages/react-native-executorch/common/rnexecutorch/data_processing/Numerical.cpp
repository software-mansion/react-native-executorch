#include "Numerical.h"

#include <algorithm>
#include <cmath>
#include <limits>
#include <numeric>

namespace rnexecutorch::numerical {

void softmax(std::span<float> input) {

  if (input.empty()) {
    return;
  }

  const auto maxElement = *std::max_element(
      std::begin(input), std::end(input)); // for numerical stability
  std::transform(
      std::begin(input), std::end(input), std::begin(input),
      [maxElement](float value) { return std::exp(value - maxElement); });

  const auto sum = std::accumulate(std::begin(input), std::end(input), 0.0F);

  // sum is at least 1 since exp(max - max) == exp(0) == 1
  std::transform(std::begin(input), std::end(input), std::begin(input),
                 [sum](float value) { return value / sum; });
}

void normalize(std::span<float> input) {

  if (input.empty()) {
    return;
  }

  const auto mean =
      std::accumulate(std::begin(input), std::end(input), 0.0F) / input.size();
  const auto squaredSum = std::inner_product(std::begin(input), std::end(input),
                                             std::begin(input), 0.0F);
  const auto variance = (squaredSum / input.size()) - (mean * mean);
  const auto standardDeviation = std::sqrt(variance);

  const auto epsilon = std::numeric_limits<float>::epsilon();
  // If standard deviation is extremely small return zero vector
  // This prevents dividing by almost zero values
  if (standardDeviation < epsilon) {
    std::fill(input.begin(), input.end(), 0.0F);
    return;
  }

  std::transform(std::begin(input), std::end(input), std::begin(input),
                 [mean, standardDeviation](float value) {
                   return (value - mean) / standardDeviation;
                 });
}

std::vector<float> meanPooling(std::span<const float> modelOutput,
                               std::span<const int64_t> attnMask) {
  auto attnMaskLength = attnMask.size();
  auto embeddingDim = modelOutput.size() / attnMaskLength;

  auto maskSum = static_cast<float>(std::accumulate(
      attnMask.begin(), attnMask.end(), static_cast<int64_t>(0)));
  maskSum = std::max(maskSum, 1e-9F);

  std::vector<float> result{};
  result.reserve(embeddingDim);
  for (size_t i = 0; i < embeddingDim; i++) {
    float dimensionSum = 0.0F;
    for (size_t j = 0; j < attnMaskLength; j++) {
      dimensionSum +=
          modelOutput[j * embeddingDim + i] * static_cast<float>(attnMask[j]);
    }
    result.push_back(dimensionSum / maskSum);
  }
  return result;
}

} // namespace rnexecutorch::numerical
