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
  int outputWidth = 0;   // width of argmax/class buffers in pixels
  int outputHeight = 0;  // height of argmax/class buffers in pixels
};

} // namespace rnexecutorch::models::semantic_segmentation
