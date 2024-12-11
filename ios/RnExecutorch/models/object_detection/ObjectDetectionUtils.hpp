#ifndef ObjectDetectionUtils_hpp
#define ObjectDetectionUtils_hpp

#include <stdio.h>
#include <vector>
#import <Foundation/Foundation.h>

struct Detection{
  float x1;
  float y1;
  float x2;
  float y2;
  float label;
  float score;
};

NSDictionary* detectionToNSDictionary(const Detection& detection);
float iou(const Detection& a, const Detection& b);
std::vector<Detection> nms(std::vector<Detection> detections, float iouThreshold);

#endif /* ObjectDetectionUtils_hpp */
