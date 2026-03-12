#pragma once

#include <memory>
#include <rnexecutorch/jsi/OwningArrayBuffer.h>
#include <string>
#include <variant>

namespace rnexecutorch::models::style_transfer {

struct PixelDataResult {
  std::shared_ptr<OwningArrayBuffer> dataPtr;
  int width;
  int height;
};

using StyleTransferResult = std::variant<PixelDataResult, std::string>;

} // namespace rnexecutorch::models::style_transfer
