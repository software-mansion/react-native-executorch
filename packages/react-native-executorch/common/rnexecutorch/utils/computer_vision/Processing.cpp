#include "Processing.h"
#include <algorithm>
#include <cmath>

namespace rnexecutorch::utils::computer_vision {

float computeIoU(const BBox &a, const BBox &b) {
  float x1 = std::max(a.x1, b.x1);
  float y1 = std::max(a.y1, b.y1);
  float x2 = std::min(a.x2, b.x2);
  float y2 = std::min(a.y2, b.y2);

  float intersectionArea = std::max(0.0f, x2 - x1) * std::max(0.0f, y2 - y1);
  float areaA = a.area();
  float areaB = b.area();
  float unionArea = areaA + areaB - intersectionArea;

  return (unionArea > 0.0f) ? (intersectionArea / unionArea) : 0.0f;
}

BBox scaleBBox(const BBox &box, float widthRatio, float heightRatio) {
  return {
      .x1 = box.x1 * widthRatio,
      .y1 = box.y1 * heightRatio,
      .x2 = box.x2 * widthRatio,
      .y2 = box.y2 * heightRatio,
  };
}

BBox clipBBox(const BBox &box, float maxWidth, float maxHeight) {
  return {
      .x1 = std::max(0.0f, box.x1),
      .y1 = std::max(0.0f, box.y1),
      .x2 = std::min(maxWidth, box.x2),
      .y2 = std::min(maxHeight, box.y2),
  };
}

} // namespace rnexecutorch::utils::computer_vision
