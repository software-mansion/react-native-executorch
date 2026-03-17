#pragma once

#include <memory>
#include <rnexecutorch/jsi/OwningArrayBuffer.h>
#include <string>
#include <unordered_map>

namespace rnexecutorch::models::semantic_segmentation {

struct SegmentationResult {
  std::shared_ptr<OwningArrayBuffer> argmax;
  std::shared_ptr<
      std::unordered_map<std::string, std::shared_ptr<OwningArrayBuffer>>>
      classBuffers;
};

} // namespace rnexecutorch::models::semantic_segmentation
