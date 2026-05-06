#pragma once

#include <executorch/runtime/core/evalue.h>
#include <executorch/runtime/core/exec_aten/exec_aten.h>
#include <span>

namespace rnexecutorch {
namespace utils {
namespace tensor {

/// Returns a read-only span over the tensor's flat data buffer.
/// The span is valid only as long as the tensor exists.
template <typename T>
std::span<const T> toSpan(const executorch::aten::Tensor &tensor) {
  return std::span<const T>(static_cast<const T *>(tensor.const_data_ptr()),
                            tensor.numel());
}

/// Convenience overload that extracts the tensor from an EValue first.
/// Assumes evalue.isTensor() == true.
template <typename T>
std::span<const T> toSpan(const executorch::runtime::EValue &evalue) {
  return toSpan<T>(evalue.toTensor());
}

} // namespace tensor
} // namespace utils
} // namespace rnexecutorch
