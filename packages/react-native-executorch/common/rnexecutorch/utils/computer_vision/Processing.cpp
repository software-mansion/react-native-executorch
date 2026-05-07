#include "Processing.h"
#include <algorithm>

namespace rnexecutorch::utils::computer_vision {

float computeIoU(const BBox &a, const BBox &b) {
  float x1 = std::max(a.p1.x, b.p1.x);
  float y1 = std::max(a.p1.y, b.p1.y);
  float x2 = std::min(a.p2.x, b.p2.x);
  float y2 = std::min(a.p2.y, b.p2.y);

  float intersectionArea = std::max(0.0f, x2 - x1) * std::max(0.0f, y2 - y1);
  float areaA = a.area();
  float areaB = b.area();
  float unionArea = areaA + areaB - intersectionArea;

  return (unionArea > 0.0f) ? (intersectionArea / unionArea) : 0.0f;
}

} // namespace rnexecutorch::utils::computer_vision
