#pragma once

#include <executorch/runtime/core/portable_type/scalar_type.h>
#include <memory>
#include <rnexecutorch/jsi/OwningArrayBuffer.h>
#include <vector>

namespace rnexecutorch {

using executorch::runtime::etensor::ScalarType;

struct JSTensorViewOut {
  std::vector<int32_t> sizes;
  ScalarType scalarType;
  std::shared_ptr<OwningArrayBuffer> data;

  JSTensorViewOut(std::vector<int32_t> sizes, ScalarType scalarType,
                  std::shared_ptr<OwningArrayBuffer> data)
      : sizes(std::move(sizes)), scalarType(scalarType), data(std::move(data)) {
  }
};
} // namespace rnexecutorch
