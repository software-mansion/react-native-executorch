#pragma once

#include <array>
#include <string>
#include <vector>

namespace rnexecutorch {

struct Point {
  float x;
  float y;
};

struct OCRDetection {
  std::array<Point, 4> bbox;
  std::string text;
  float score;
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

namespace ocr {

struct MaxValuesAndIndices {
  std::vector<float> values;
  std::vector<int32_t> indices;
};
} // namespace ocr
} // namespace rnexecutorch
