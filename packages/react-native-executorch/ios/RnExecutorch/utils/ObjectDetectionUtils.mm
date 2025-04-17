#include "ObjectDetectionUtils.hpp"
#include "Constants.h"
#include <map>
#include <vector>

NSString *floatLabelToNSString(float label) {
  int intLabel = static_cast<int>(label);
  auto it = cocoLabelsMap.find(intLabel);
  if (it != cocoLabelsMap.end()) {
    return [NSString stringWithUTF8String:it->second.c_str()];
  } else {
    return [NSString stringWithUTF8String:"unknown"];
  }
}

NSDictionary *detectionToNSDictionary(const Detection &detection) {
  return @{
    @"bbox" : @{
      @"x1" : @(detection.x1),
      @"y1" : @(detection.y1),
      @"x2" : @(detection.x2),
      @"y2" : @(detection.y2),
    },
    @"label" : floatLabelToNSString(detection.label),
    @"score" : @(detection.score)
  };
}

float iou(const Detection &a, const Detection &b) {
  float x1 = std::max(a.x1, b.x1);
  float y1 = std::max(a.y1, b.y1);
  float x2 = std::min(a.x2, b.x2);
  float y2 = std::min(a.y2, b.y2);

  float intersectionArea = std::max(0.0f, x2 - x1) * std::max(0.0f, y2 - y1);
  float areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
  float areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
  float unionArea = areaA + areaB - intersectionArea;

  return intersectionArea / unionArea;
};

std::vector<Detection> nms(std::vector<Detection> detections,
                           float iouThreshold) {
  if (detections.empty()) {
    return {};
  }

  // Sort by label, then by score
  std::sort(detections.begin(), detections.end(),
            [](const Detection &a, const Detection &b) {
              if (a.label == b.label) {
                return a.score > b.score;
              }
              return a.label < b.label;
            });

  std::vector<Detection> result;
  // Apply NMS for each label
  for (size_t i = 0; i < detections.size();) {
    float currentLabel = detections[i].label;

    std::vector<Detection> labelDetections;
    while (i < detections.size() && detections[i].label == currentLabel) {
      labelDetections.push_back(detections[i]);
      ++i;
    }

    std::vector<Detection> filteredLabelDetections;
    while (!labelDetections.empty()) {
      Detection current = labelDetections.front();
      filteredLabelDetections.push_back(current);
      labelDetections.erase(
          std::remove_if(labelDetections.begin(), labelDetections.end(),
                         [&](const Detection &other) {
                           return iou(current, other) > iouThreshold;
                         }),
          labelDetections.end());
    }
    result.insert(result.end(), filteredLabelDetections.begin(),
                  filteredLabelDetections.end());
  }
  return result;
}
