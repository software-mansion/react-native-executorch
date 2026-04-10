#pragma once

#include <executorch/runtime/core/evalue.h>
#include <executorch/runtime/core/exec_aten/exec_aten.h>
#include <span>

namespace rnexecutorch {
namespace utils {
namespace tensor {

/**
 * @brief Convert a tensor to a typed span for safe data access
 *
 * Provides type-safe access to tensor data via std::span, eliminating
 * manual pointer arithmetic and size calculations.
 *
 * @tparam T The element type (e.g., float, int32_t)
 * @param tensor The tensor to convert
 * @return std::span<const T> A read-only view of the tensor data
 *
 * @note The returned span is valid only as long as the tensor exists
 *
 * Example:
 * @code
 * auto tensor = getTensor();
 * auto data = tensor::toSpan<float>(tensor);
 * for (float value : data) {
 *   // Process value...
 * }
 * @endcode
 */
template <typename T>
std::span<const T> toSpan(const executorch::aten::Tensor &tensor) {
  return std::span<const T>(static_cast<const T *>(tensor.const_data_ptr()),
                            tensor.numel());
}

/**
 * @brief Convert an EValue containing a tensor to a typed span
 *
 * Convenience overload for extracting tensor data from EValue results.
 *
 * @tparam T The element type (e.g., float, int32_t)
 * @param evalue The EValue containing a tensor
 * @return std::span<const T> A read-only view of the tensor data
 *
 * @note Assumes evalue.isTensor() == true. Behavior is undefined otherwise.
 *
 * Example:
 * @code
 * auto result = model.forward(input);
 * auto outputs = tensor::toSpan<float>(result.get()[0]);
 * @endcode
 */
template <typename T>
std::span<const T> toSpan(const executorch::runtime::EValue &evalue) {
  return toSpan<T>(evalue.toTensor());
}

} // namespace tensor
} // namespace utils
} // namespace rnexecutorch
