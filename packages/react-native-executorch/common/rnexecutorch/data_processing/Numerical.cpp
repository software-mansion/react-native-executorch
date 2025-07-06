#include "Numerical.h"

#include <algorithm>
#include <cmath>
#include <limits>
#include <numeric>
#include <sstream>
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
  if (attnMask.empty() || modelOutput.size() % attnMask.size() != 0) {
    std::stringstream ss;
    ss << "Invalid dimensions for mean pooling, expected model output size to "
          "be divisible "
       << "by the size of attention mask but got size: " << modelOutput.size()
       << " for model output and size: " << attnMask.size()
       << " for attention mask";
    throw std::invalid_argument(ss.str());
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
