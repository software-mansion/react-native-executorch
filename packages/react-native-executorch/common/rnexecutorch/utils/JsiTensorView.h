#pragma once

#include <executorch/extension/tensor/tensor.h>

using executorch::aten::ScalarType;

namespace rnexecutorch {
struct JsiTensorView {
  void *dataPtr;
  ScalarType scalarType;
  std::vector<int32_t> shape;
};
} // namespace rnexecutorch
