#pragma once

#include <cstdint>
#include <rnexecutorch/utils/computer_vision/Types.h>
#include <vector>

namespace rnexecutorch::models::instance_segmentation::types {

/**
 * Represents a single detected instance in instance segmentation output.
 *
 * Contains bounding box coordinates, binary segmentation mask, class label,
 * and confidence score.
 */
struct Instance {
  utils::computer_vision::BBox bbox; ///< Bounding box coordinates
  std::vector<uint8_t> mask;         ///< Binary mask (0 or 1) for the instance
  int32_t maskWidth;                 ///< Width of the mask array
  int32_t maskHeight;                ///< Height of the mask array
  int32_t classIndex;                ///< Model output class index
  float score;                       ///< Confidence score [0, 1]

  Instance() = default;
  Instance(utils::computer_vision::BBox bbox, std::vector<uint8_t> mask,
           int32_t maskWidth, int32_t maskHeight, int32_t classIndex,
           float score)
      : bbox(bbox), mask(std::move(mask)), maskWidth(maskWidth),
        maskHeight(maskHeight), classIndex(classIndex), score(score) {}
};

} // namespace rnexecutorch::models::instance_segmentation::types
