#pragma once

using executorch::aten::ScalarType;

namespace rnexecutorch {
struct JsiTensorView {
  void *dataPtr;
  ScalarType scalarType;
  std::vector<int32_t> shape;
};
} // namespace rnexecutorch
