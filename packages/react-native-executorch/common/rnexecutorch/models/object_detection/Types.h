#pragma once

#include <string>

namespace rnexecutorch::models::object_detection::types {
struct Detection {
  float x1;
  float y1;
  float x2;
  float y2;
  std::string label;
  float score;
};

} // namespace rnexecutorch::models::object_detection::types