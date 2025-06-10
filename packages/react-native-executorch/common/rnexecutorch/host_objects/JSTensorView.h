#pragma once

namespace rnexecutorch {

using executorch::aten::ScalarType;

struct JSTensorView {
  void *dataPtr;
  ScalarType scalarType;
  std::vector<int32_t> shape;
};
} // namespace rnexecutorch
