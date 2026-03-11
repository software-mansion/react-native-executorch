#pragma once

#include <cstdint>
#include <rnexecutorch/utils/computer_vision/Types.h>
#include <string>

namespace rnexecutorch::models::object_detection::types {
struct Detection {
  utils::computer_vision::BBox bbox;
  std::string label;
  int32_t classIndex;
  float score;

  Detection() = default;
  Detection(utils::computer_vision::BBox bbox, std::string label,
            int32_t classIndex, float score)
      : bbox(bbox), label(std::move(label)), classIndex(classIndex),
        score(score) {}
};

} // namespace rnexecutorch::models::object_detection::types
