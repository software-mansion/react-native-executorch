#pragma once

#include <vector>

namespace rnexecutorch::models::instance_segmentation::types {

struct InstanceMask {
  float x1;
  float y1;
  float x2;
  float y2;
  std::vector<uint8_t> mask;
  int maskWidth;
  int maskHeight;
  int label;
  float score;
  int instanceId;
};

} // namespace rnexecutorch::models::instance_segmentation::types
