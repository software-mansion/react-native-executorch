#pragma once

#include <array>
#include <string>

namespace rnexecutorch
{
  struct Point
  {
    float x;
    float y;
  };

  struct OCRDetection
  {
    std::array<Point, 4> bbox;
    std::string text;
    float score;
  };

  struct DetectorBBox
  {
    std::array<Point, 4> bbox;
    float angle;
  };
} // namespace rnexecutorch