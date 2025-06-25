#pragma once

#include <array>
#include <string>

namespace rnexecutorch {
struct OCRDetection {
  std::array<float, 4> bbox;
  std::string text;
  float score;
};

struct DetectorBBox {
  struct Point {
    float x;
    float y;
  };
  std::array<Point, 4> bbox;
  float angle;
};
} // namespace rnexecutorch