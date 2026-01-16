#pragma once

#include <algorithm>
#include <concepts>
#include <numeric>
#include <span>
#include <vector>

/**
 * @namespace rnexecutorch::sequential
 * @brief Namespace for non-modifying sequential operations
 */
namespace rnexecutorch::sequential {

/**
 * @brief Repeats each element of a one-dimensional data vector according to the
 * specified repetition counts.
 *
 * This function operates on one-dimensional input data and a corresponding
 * vector of repetition counts. For each i-th element in `data`, the function
 * appends it to the output vector `repetitions[i]` times. For example, given
 * `data = [0, 1, 2]` and `repetitions = [2, 1, 2]`, the result will be `[0, 0,
 * 1, 2, 2]`.
 *
 * @param data A span of input elements to be repeated.
 * @param repetitions A span of integral values specifying how many times to
 * repeat each corresponding element in `data`.
 * @return A std::vector<T> containing the repeated elements in order.
 */
template <typename T, std::integral IType>
std::vector<T> repeatInterleave(std::span<const T> data,
                                std::span<const IType> repetitions) {
  if (data.size() != repetitions.size()) {
    throw std::invalid_argument(
        "repeatInterleave(): repetitions vector must be the same size as data,"
        " expected " +
        std::to_string(data.size()) + " but got " +
        std::to_string(repetitions.size()));
  }

  IType totalReps = std::reduce(repetitions.begin(), repetitions.end());
  std::vector<T> result(totalReps);

  IType filled = 0;
  for (size_t i = 0; i < data.size(); i++) {
    std::fill_n(result.begin() + filled, repetitions[i], data[i]);
    filled += repetitions[i];
  }

  return result;
}

} // namespace rnexecutorch::sequential