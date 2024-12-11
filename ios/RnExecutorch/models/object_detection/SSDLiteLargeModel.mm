#include "SSDLiteLargeModel.hpp"
#include "ImageProcessor.h"
#include "ObjectDetectionUtils.hpp"
#include <vector>

inline float constexpr iouThreshold = 0.55;
inline float constexpr detectionThreshold = 0.7;
inline int constexpr inputWidth = 320;
inline int constexpr inputHeight = 320;

@implementation SSDLiteLargeModel

- (NSArray *)preprocess:(cv::Mat)input {
  cv::resize(input, input, cv::Size(inputWidth, inputHeight));
  NSArray *modelInput = [ImageProcessor matToNSArray:input];
  return modelInput;
}

- (NSArray *)postprocess:(NSArray *)input {
  NSArray *bboxes = [input objectAtIndex:0];
  NSArray *scores = [input objectAtIndex:1];
  NSArray *labels = [input objectAtIndex:2];

  std::vector<Detection> detections;

  for (NSUInteger idx = 0; idx < scores.count; idx++) {
    float score = [scores[idx] floatValue];
    float label = [labels[idx] floatValue];
    if (score < detectionThreshold) {
      continue;
    }
    float x1 = [bboxes[idx * 4] floatValue];
    float y1 = [bboxes[idx * 4 + 1] floatValue];
    float x2 = [bboxes[idx * 4 + 2] floatValue];
    float y2 = [bboxes[idx * 4 + 3] floatValue];

    Detection det = {x1, y1, x2, y2, label, score};
    detections.push_back(det);
  }
  std::vector<Detection> nms_output = nms(detections, iouThreshold);
  
  NSMutableArray *output = [NSMutableArray array];
  for (Detection& detection: nms_output) {
    [output addObject: detectionToNSDictionary(detection)];
  }

  return output;
}

- (NSArray *)runModel:(cv::Mat)input {
  NSLog(@"Calling runMoodel");
  NSArray *modelInput = [self preprocess:input];
  NSError *forwardError = nil;
  NSArray *forwardResult = [self forward:modelInput
                            shape:@[ @1, @3, @320, @320 ]
                        inputType:@3
                            error:&forwardError];
  NSArray *output = [self postprocess:forwardResult];
  return output;
}

@end
