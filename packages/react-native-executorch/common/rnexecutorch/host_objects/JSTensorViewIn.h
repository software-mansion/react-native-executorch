#pragma once

#include <executorch/runtime/core/exec_aten/exec_aten.h>
#include <vector>

namespace rnexecutorch {

using executorch::aten::ScalarType;

struct JSTensorViewIn {
  void *dataPtr;
  std::vector<int32_t> sizes;
  ScalarType scalarType;
};
} // namespace rnexecutorch
