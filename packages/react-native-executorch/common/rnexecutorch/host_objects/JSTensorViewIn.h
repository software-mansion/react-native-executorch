#pragma once

namespace rnexecutorch {

using executorch::aten::ScalarType;

struct JSTensorViewIn {
  void *dataPtr;
  std::vector<int32_t> sizes;
  ScalarType scalarType;
};
} // namespace rnexecutorch
