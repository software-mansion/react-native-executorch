#pragma once

#include "Types.h"
#include <algorithm>
#include <vector>

namespace rnexecutorch::utils::computer_vision {

float computeIoU(const BBox &a, const BBox &b);

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

// Weighted (blending) NMS, used by BlazeFace-style detectors. Overlapping
// anchors of the same class are score-weighted-averaged into a single box
// instead of greedily pruned to the top scorer. The output box position is
// `sum(box_i * score_i) / sum(score_i)` (paper § 3.2). The output score is
// the *max* of the cluster, not the mean: with a low pre-NMS threshold the
// mean drifts around the cluster floor and makes the detection flicker
// in/out as low-confidence anchors enter/leave the cluster between frames.
template <HasBBoxAndScore T>
std::vector<T> weightedNonMaxSuppression(std::vector<T> items,
                                         double iouThreshold) {
  if (items.empty()) {
    return {};
  }

  std::ranges::sort(items,
                    [](const T &a, const T &b) { return a.score > b.score; });

  std::vector<T> result;
  std::vector<bool> consumed(items.size(), false);

  for (size_t i = 0; i < items.size(); ++i) {
    if (consumed[i]) {
      continue;
    }
    consumed[i] = true;

    float totalScore = items[i].score;
    float wx1 = items[i].bbox.p1.x * items[i].score;
    float wy1 = items[i].bbox.p1.y * items[i].score;
    float wx2 = items[i].bbox.p2.x * items[i].score;
    float wy2 = items[i].bbox.p2.y * items[i].score;

    for (size_t j = i + 1; j < items.size(); ++j) {
      if (consumed[j]) {
        continue;
      }

      if constexpr (requires(T t) { t.classIndex; }) {
        if (items[i].classIndex != items[j].classIndex) {
          continue;
        }
      }

      float iou = computeIoU(items[i].bbox, items[j].bbox);
      if (iou > iouThreshold) {
        consumed[j] = true;
        totalScore += items[j].score;
        wx1 += items[j].bbox.p1.x * items[j].score;
        wy1 += items[j].bbox.p1.y * items[j].score;
        wx2 += items[j].bbox.p2.x * items[j].score;
        wy2 += items[j].bbox.p2.y * items[j].score;
      }
    }

    T blended = items[i];
    if (totalScore > 0.0f) {
      blended.bbox.p1 = {wx1 / totalScore, wy1 / totalScore};
      blended.bbox.p2 = {wx2 / totalScore, wy2 / totalScore};
    }
    result.push_back(blended);
  }

  return result;
}

} // namespace rnexecutorch::utils::computer_vision
