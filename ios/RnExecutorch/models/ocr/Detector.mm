#import "opencv2/opencv.hpp"
#import "Detector.h"
#import "../../utils/ImageProcessor.h"
#import "utils/DetectorUtils.h"
#import "utils/OCRUtils.h"

@implementation Detector {
  cv::Size originalSize;
}

- (cv::Size)getModelImageSize{
  NSArray * inputShape = [module getInputShape: @0];
  NSNumber *widthNumber = inputShape.lastObject;
  NSNumber *heightNumber = inputShape[inputShape.count - 2];
  
  int height = [heightNumber intValue];
  int width = [widthNumber intValue];
  return cv::Size(height, width);
}

- (NSArray *)preprocess:(cv::Mat &)input {
  self->originalSize = cv::Size(input.cols, input.rows);
  
  cv::Size modelImageSize = [self getModelImageSize];
  cv::Mat resizedImage;
  resizedImage = [OCRUtils resizeWithPadding:input desiredWidth:modelImageSize.width desiredHeight:modelImageSize.height];
  
  NSArray *modelInput = [DetectorUtils matToNSArray: resizedImage];
  return modelInput;
}

- (NSArray *)postprocess:(NSArray *)output {
  NSArray *predictions = [output objectAtIndex:0];
  
  NSDictionary *splittedData = [DetectorUtils splitInterleavedNSArray:predictions];
  NSArray *scoreText = splittedData[@"ScoreText"];
  NSArray *scoreLink = splittedData[@"ScoreLink"];
  
  cv::Mat scoreTextCV;
  cv::Mat scoreLinkCV;
  
  scoreTextCV = [DetectorUtils arrayToMat:scoreText width:640 height:640];
  scoreLinkCV = [DetectorUtils arrayToMat:scoreLink width:640 height:640];
  
  NSArray* boxes = [DetectorUtils getDetBoxes:scoreTextCV linkMap:scoreLinkCV textThreshold:0.7 linkThreshold:0.4 lowText:0.4];
  NSMutableArray *single_img_result = [NSMutableArray array];
  for (NSUInteger i = 0; i < [boxes count]; i++) {
    NSArray *box = boxes[i];
    NSMutableArray *boxArray = [NSMutableArray arrayWithCapacity:4];
    for (NSValue *value in box) {
      CGPoint point = [value CGPointValue];
      point.x *= 2;
      point.y *= 2;
      [boxArray addObject:@((int)point.x)];
      [boxArray addObject:@((int)point.y)];
    }
    [single_img_result addObject:boxArray];
  }
  
  NSArray* horizontalList = [DetectorUtils groupTextBox:single_img_result ycenterThs:0.5 heightThs:0.5 widthThs:0.5 addMargin:0.1];
  
  NSMutableArray *boxesToKeep = [NSMutableArray array];
  
  for (NSArray *box in horizontalList) {
    if (MAX([box[1] intValue] - [box[0] intValue], [box[3] intValue] - [box[2] intValue]) >= 20) {
      
      [boxesToKeep addObject:box];
    }
  }
  
  horizontalList = [NSMutableArray arrayWithArray:boxesToKeep];
  return horizontalList;
}

- (NSArray *)runModel:(cv::Mat &)input {
  NSArray *modelInput = [self preprocess:input];
  NSArray *modelResult = [self forward:modelInput];
  NSArray *result = [self postprocess:modelResult];
  
  return result;
}

@end
