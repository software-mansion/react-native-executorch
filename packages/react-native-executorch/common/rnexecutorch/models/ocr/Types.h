#pragma once

#include <array>
#include <string>
#include <vector>

namespace rnexecutorch::models::ocr::types {
struct Point {
  float x;
  float y;
};

struct ValuesAndIndices {
  std::vector<float> values;
  std::vector<int32_t> indices;
};

struct DetectorBBox {
  std::array<Point, 4> bbox;
  float angle;
};

struct PaddingInfo {
  float resizeRatio;
  int32_t top;
  int32_t left;
};

struct OCRDetection {
  std::array<types::Point, 4> bbox;
  std::string text;
  float score;
};

} // namespace rnexecutorch::models::ocr::types
