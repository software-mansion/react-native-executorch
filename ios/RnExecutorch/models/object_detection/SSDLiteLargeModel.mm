#include "SSDLiteLargeModel.hpp"
#include "../../utils/ObjectDetectionUtils.hpp"
#include "ImageProcessor.h"
#include <vector>

float constexpr iouThreshold = 0.55;
float constexpr detectionThreshold = 0.7;
int constexpr inputWidth = 320;
int constexpr inputHeight = 320;

@implementation SSDLiteLargeModel

- (NSArray *)preprocess:(cv::Mat)input {
  cv::resize(input, input, cv::Size(inputWidth, inputHeight));
  NSArray *modelInput = [ImageProcessor matToNSArray:input];
  return modelInput;
}

- (NSArray *)postprocess:(NSArray *)input
              widthRatio:(float)widthRatio
             heightRatio:(float)heightRatio {
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
    float x1 = [bboxes[idx * 4] floatValue] * widthRatio;
    float y1 = [bboxes[idx * 4 + 1] floatValue] * heightRatio;
    float x2 = [bboxes[idx * 4 + 2] floatValue] * widthRatio;
    float y2 = [bboxes[idx * 4 + 3] floatValue] * heightRatio;

    Detection det = {x1, y1, x2, y2, label, score};
    detections.push_back(det);
  }
  std::vector<Detection> nms_output = nms(detections, iouThreshold);

  NSMutableArray *output = [NSMutableArray array];
  for (Detection &detection : nms_output) {
    [output addObject:detectionToNSDictionary(detection)];
  }

  return output;
}

- (NSArray *)runModel:(cv::Mat)input {
  cv::Size size = input.size();
  int inputImageWidth = size.width;
  int inputImageHeight = size.height;
  NSArray *modelInput = [self preprocess:input];
  NSError *forwardError = nil;
  NSArray *inputShape = @[ @(1), @(3), @(inputWidth), @(inputHeight) ];
  NSArray *forwardResult = [self forward:modelInput
                                   shape:inputShape
                               inputType:@3
                                   error:&forwardError];
  if (forwardError) {
    @throw [NSException
        exceptionWithName:@"forward_error"
                   reason:[NSString
                              stringWithFormat:@"%ld", static_cast<long>(
                                                           forwardError.code)]
                 userInfo:nil];
  }
  NSArray *output = [self postprocess:forwardResult
                           widthRatio:inputImageWidth / 320.f
                          heightRatio:inputImageHeight / 320.f];
  return output;
}

@end
