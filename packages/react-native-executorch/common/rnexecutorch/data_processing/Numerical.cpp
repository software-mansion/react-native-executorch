#include "Numerical.h"

#include <algorithm>
#include <cmath>
#include <numeric>

namespace rnexecutorch::numerical {
template <typename Container> void softmax(Container &input) {
  static_assert(std::is_floating_point_v<typename Container::value_type>,
                "Softmax requires a container with floating-point type.");

  using ValueType = typename Container::value_type;

  if (input.empty()) {
    return;
  }

  constexpr auto zeroValueType = static_cast<ValueType>(0);
  const ValueType maxElement = *std::max_element(
      std::begin(input), std::end(input)); // for numerical stability
  std::transform(
      std::begin(input), std::end(input), std::begin(input),
      [maxElement](ValueType value) { return std::exp(value - maxElement); });

  const ValueType sum =
      std::accumulate(std::begin(input), std::end(input), zeroValueType);
  if (sum == zeroValueType) {
    return; // Prevent division by zero if all elements are 0 of given type
  }

  std::transform(std::begin(input), std::end(input), std::begin(input),
                 [sum](ValueType value) { return value / sum; });
}

template void softmax(std::vector<float> &);
template void softmax(std::vector<double> &);
template void softmax(std::span<float>);
template void softmax(std::span<double>);

template <typename Container> void normalize(Container &input) {
  static_assert(
      std::is_floating_point_v<typename Container::value_type>,
      "Standardization requires a container with floating-point type.");

  using ValueType = typename Container::value_type;

  if (input.empty()) {
    return;
  }

  constexpr auto zeroValueType = static_cast<ValueType>(0);
  const ValueType mean =
      std::accumulate(std::begin(input), std::end(input), zeroValueType) /
      input.size();
  const ValueType squaredSum = std::inner_product(
      std::begin(input), std::end(input), std::begin(input), zeroValueType);
  const ValueType variance = (squaredSum / input.size()) - (mean * mean);
  const ValueType standardDeviation = std::sqrt(variance);

  if (standardDeviation == zeroValueType) {
    return; // Prevent division by zero if all elements are the same
  }

  std::transform(std::begin(input), std::end(input), std::begin(input),
                 [mean, standardDeviation](ValueType value) {
                   return (value - mean) / standardDeviation;
                 });
}

template void normalize(std::vector<float> &);
template void normalize(std::vector<double> &);
template void normalize(std::span<float>);
template void normalize(std::span<double>);

std::vector<float> meanPooling(std::span<const float> modelOutput,
                               std::span<const int64_t> attnMask) {
  auto attnMaskLength = attnMask.size();
  auto embeddingDim = modelOutput.size() / attnMaskLength;

  float maskSum =
      std::accumulate(std::begin(attnMask), std::end(attnMask), 0.0F);
  maskSum = std::max(maskSum, 1e-9F);

  auto result = std::vector<float>{};
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