#pragma once

#include "Types.h"
#include <algorithm>
#include <set>
#include <string>
#include <vector>

namespace rnexecutorch::utils::computer_vision {

float computeIoU(const BBox &a, const BBox &b);

/**
 * @brief Convert class indices vector to a set for O(1) lookup
 * @param classIndices Vector of allowed class indices
 * @return Set of allowed class indices (empty set = allow all)
 */
std::set<int32_t>
prepareAllowedClasses(const std::vector<int32_t> &classIndices);

/**
 * @brief Validate that a threshold is in [0, 1] range
 * @param value Threshold value to validate
 * @param name Name of the threshold (for error messages)
 * @throws RnExecutorchError if value is out of range
 */
void validateThreshold(double value, const std::string &name);

template <HasBBoxAndScore T>
std::vector<T> nonMaxSuppression(std::vector<T> items, double iouThreshold) {
  if (items.empty()) {
    return {};
  }

  std::ranges::sort(items,
                    [](const T &a, const T &b) { return a.score > b.score; });

  std::vector<T> result;
  std::vector<bool> suppressed(items.size(), false);

  for (size_t i = 0; i < items.size(); ++i) {
    if (suppressed[i]) {
      continue;
    }

    result.push_back(items[i]);

    for (size_t j = i + 1; j < items.size(); ++j) {
      if (suppressed[j]) {
        continue;
      }

      if constexpr (requires(T t) { t.classIndex; }) {
        if (items[i].classIndex != items[j].classIndex) {
          continue;
        }
      }

      float iou = computeIoU(items[i].bbox, items[j].bbox);
      if (iou > iouThreshold) {
        suppressed[j] = true;
      }
    }
  }

  return result;
}

} // namespace rnexecutorch::utils::computer_vision
