#pragma once

#include <cstdint>
#include <memory>
#include <rnexecutorch/jsi/OwningArrayBuffer.h>
#include <rnexecutorch/utils/computer_vision/Types.h>

namespace rnexecutorch::models::instance_segmentation::types {

/**
 * Represents a single detected instance in instance segmentation output.
 *
 * Contains bounding box coordinates, binary segmentation mask, class label,
 * and confidence score.
 */
struct Instance {

  Instance() = default;
  Instance(utils::computer_vision::BBox bbox,
           std::shared_ptr<OwningArrayBuffer> mask, int32_t maskWidth,
           int32_t maskHeight, int32_t classIndex, float score)
      : bbox(bbox), mask(std::move(mask)), maskWidth(maskWidth),
        maskHeight(maskHeight), classIndex(classIndex), score(score) {}

  utils::computer_vision::BBox bbox;
  std::shared_ptr<OwningArrayBuffer> mask;
  int32_t maskWidth;
  int32_t maskHeight;
  int32_t classIndex;
  float score;
};

} // namespace rnexecutorch::models::instance_segmentation::types
