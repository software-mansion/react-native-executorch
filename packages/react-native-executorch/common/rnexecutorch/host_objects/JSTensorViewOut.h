#pragma once

#include <executorch/runtime/core/portable_type/scalar_type.h>
#include <memory>
#include <rnexecutorch/jsi/OwningArrayBuffer.h>
#include <vector>

namespace rnexecutorch {

using executorch::runtime::etensor::ScalarType;

struct JSTensorViewOut {
  std::shared_ptr<OwningArrayBuffer> dataPtr;
  std::vector<int32_t> sizes;
  ScalarType scalarType;

  JSTensorViewOut(std::vector<int32_t> sizes, ScalarType scalarType,
                  std::shared_ptr<OwningArrayBuffer> dataPtr)
      : dataPtr(std::move(dataPtr)), sizes(std::move(sizes)),
        scalarType(scalarType) {}
};
} // namespace rnexecutorch
