#include "Numerical.h"

#include <algorithm>
#include <cmath>
#include <format>
#include <limits>
#include <numeric>
#include <string>

namespace rnexecutorch::numerical {

void softmax(std::span<float> input) {
  if (input.empty()) {
    return;
  }

  const auto maxElement = *std::ranges::max_element(input);

  for (auto &value : input) {
    value = std::exp(value - maxElement);
  }

  const auto sum = std::reduce(input.begin(), input.end());

  // sum is at least 1 since exp(max - max) == exp(0) == 1
  for (auto &value : input) {
    value /= sum;
  }
}

void normalize(std::span<float> input) {
  const auto sumOfSquares =
      std::inner_product(input.begin(), input.end(), input.begin(), 0.0F);

  constexpr auto kEpsilon = 1.0e-15F;

  const auto norm = std::sqrt(sumOfSquares) + kEpsilon;

  for (auto &value : input) {
    value /= norm;
  }
}

std::vector<float> meanPooling(std::span<const float> modelOutput,
                               std::span<const int64_t> attnMask) {
  if (attnMask.empty() || modelOutput.size() % attnMask.size() != 0) {
    throw std::invalid_argument(
        std::format("Invalid dimensions for mean pooling, expected model "
                    "output size to be divisible "
                    "by the size of attention mask but got size: {} for model "
                    "output and size: {} for attention mask",
                    modelOutput.size(), attnMask.size()));
  }

  auto attnMaskLength = attnMask.size();
  auto embeddingDim = modelOutput.size() / attnMaskLength;

  auto maskSum = std::reduce(attnMask.begin(), attnMask.end());
  std::vector<float> result(embeddingDim, 0.0F);
  if (maskSum == 0LL) {
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

template <typename T> bool isClose(T a, T b, T atol) {
  return std::abs(a - b) <= atol;
}

template bool isClose<float>(float, float, float);
template bool isClose<double>(double, double, double);

} // namespace rnexecutorch::numerical
