#pragma once

#include <cstdint>
#include <vector>

namespace rnexecutorch::models::instance_segmentation::types {

/**
 * Represents a single detected instance in instance segmentation output.
 *
 * Contains bounding box coordinates, binary segmentation mask, class label,
 * confidence score, and a unique instance identifier.
 */
struct InstanceMask {
  float x1;                  ///< Bounding box left coordinate
  float y1;                  ///< Bounding box top coordinate
  float x2;                  ///< Bounding box right coordinate
  float y2;                  ///< Bounding box bottom coordinate
  std::vector<uint8_t> mask; ///< Binary mask (0 or 1) for the instance
  int maskWidth;             ///< Width of the mask array
  int maskHeight;            ///< Height of the mask array
  int32_t classIndex;        ///< Model output class index
  float score;               ///< Confidence score [0, 1]
  int instanceId;            ///< Unique identifier for this instance
};

} // namespace rnexecutorch::models::instance_segmentation::types
