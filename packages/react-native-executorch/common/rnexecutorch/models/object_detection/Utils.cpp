#include "Utils.h"
#include "Constants.h"

namespace rnexecutorch::models::object_detection::utils {
float intersectionOverUnion(const types::Detection &a,
                            const types::Detection &b) {
  float x1 = std::max(a.x1, b.x1);
  float y1 = std::max(a.y1, b.y1);
  float x2 = std::min(a.x2, b.x2);
  float y2 = std::min(a.y2, b.y2);

  float intersectionArea = std::max(0.0f, x2 - x1) * std::max(0.0f, y2 - y1);
  float areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
  float areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
  float unionArea = areaA + areaB - intersectionArea;

  return intersectionArea / unionArea;
}

std::vector<types::Detection>
nonMaxSuppression(std::vector<types::Detection> detections) {
  if (detections.empty()) {
    return {};
  }

  // Sort by label, then by score
  std::sort(detections.begin(), detections.end(),
            [](const types::Detection &a, const types::Detection &b) {
              if (a.label == b.label) {
                return a.score > b.score;
              }
              return a.label < b.label;
            });

  std::vector<types::Detection> result;
  // Apply NMS for each label
  for (size_t i = 0; i < detections.size();) {
    float currentLabel = detections[i].label;

    std::vector<types::Detection> labelDetections;
    while (i < detections.size() && detections[i].label == currentLabel) {
      labelDetections.push_back(detections[i]);
      ++i;
    }

    std::vector<types::Detection> filteredLabelDetections;
    while (!labelDetections.empty()) {
      types::Detection current = labelDetections.front();
      filteredLabelDetections.push_back(current);
      labelDetections.erase(
          std::remove_if(labelDetections.begin(), labelDetections.end(),
                         [&current](const types::Detection &other) {
                           return intersectionOverUnion(current, other) >
                                  constants::IOU_THRESHOLD;
                         }),
          labelDetections.end());
    }
    result.insert(result.end(), filteredLabelDetections.begin(),
                  filteredLabelDetections.end());
  }
  return result;
}

} // namespace rnexecutorch::models::object_detection::utils