#pragma once

#include <memory>
#include <rnexecutorch/jsi/OwningArrayBuffer.h>

namespace rnexecutorch::models::style_transfer {

struct PixelDataResult {
  std::shared_ptr<OwningArrayBuffer> dataPtr;
  int width;
  int height;
};

} // namespace rnexecutorch::models::style_transfer
