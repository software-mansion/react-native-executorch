#pragma once

#include "Types.h"
#include <algorithm>
#include <ranges>
#include <vector>

namespace rnexecutorch::utils::computer_vision {

float computeIoU(const BBox &a, const BBox &b);

BBox scaleBBox(const BBox &box, float widthRatio, float heightRatio);

BBox clipBBox(const BBox &box, float maxWidth, float maxHeight);

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
