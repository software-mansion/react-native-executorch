#include "Processing.h"
#include <algorithm>
#include <cmath>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>

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

std::set<int32_t>
prepareAllowedClasses(const std::vector<int32_t> &classIndices) {
  std::set<int32_t> allowedClasses;
  if (!classIndices.empty()) {
    allowedClasses.insert(classIndices.begin(), classIndices.end());
  }
  return allowedClasses;
}

void validateThreshold(double value, const std::string &name) {
  if (value < 0.0 || value > 1.0) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            name + " must be in range [0, 1]");
  }
}

} // namespace rnexecutorch::utils::computer_vision
