#include "Numerical.h"

#include <algorithm>
#include <cmath>
#include <limits>
#include <numeric>
#include <string>

namespace rnexecutorch::numerical {

void softmax(std::span<float> input) {

  if (input.empty()) [[unlikely]] {
    return;
  }

  const auto maxElement = *std::ranges::max_element(input);

  for (auto &value : input) {
    value = std::exp(value - maxElement);
  }

  const auto sum = std::reduce(std::begin(input), std::end(input));

  // sum is at least 1 since exp(max - max) == exp(0) == 1
  for (auto &value : input) {
    value /= sum;
  }
}

void normalize(std::span<float> input) {
  if (input.empty()) [[unlikely]] {
    return;
  }

  const auto squaredSum = std::inner_product(std::begin(input), std::end(input),
                                             std::begin(input), 0.0F);

  constexpr auto epsilon = std::numeric_limits<float>::epsilon();
  if (squaredSum < epsilon) [[unlikely]] {
    return;
  }

  const auto norm = std::sqrt(squaredSum);

  for (auto &value : input) {
    value /= norm;
  }
}

std::vector<float> meanPooling(std::span<const float> modelOutput,
                               std::span<const int64_t> attnMask) {

  if (attnMask.empty() || modelOutput.size() % attnMask.size() != 0) [[unlikely]] {
    throw std::invalid_argument(
        "Invalid dimensions for mean pooling, expected model output size to be "
        "divisable by the size of attention mask but got size: " +
        std::to_string(modelOutput.size()) + " for model output and size: " +
        std::to_string(modelOutput.size()) + " for attention mask");
  }

  auto attnMaskLength = attnMask.size();
  auto embeddingDim = modelOutput.size() / attnMaskLength;

  auto maskSum = std::reduce(attnMask.begin(), attnMask.end());
  std::vector<float> result(embeddingDim, 0.0F);
  if (maskSum == 0LL) [[unlikely]] {
    return result;
  }

  for (std::size_t i = 0; i < attnMaskLength; ++i) {
    if (attnMask[i] != 0LL) {
      for (std::size_t j = 0; j < embeddingDim; ++j) {
        result[j] += modelOutput[i * embeddingDim + j];
      }
    }
  }

  for (auto &value : result) {
    value /= static_cast<float>(maskSum);
  }

  return result;
}

} // namespace rnexecutorch::numerical
