#pragma once

#include <vector>

namespace rnexecutorch {
struct Detection {
  float x1;
  float y1;
  float x2;
  float y2;
  int label;
  float score;
};

float intersectionOverUnion(const Detection &a, const Detection &b);
std::vector<Detection> nonMaxSuppression(std::vector<Detection> detections);
} // namespace rnexecutorch