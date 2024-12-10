#import "StyleTransferModel.h"
#import "../utils/ImageProcessor.h"
#import "opencv2/opencv.hpp"

@implementation StyleTransferModel {
  cv::Size originalSize;
}

- (NSArray *)preprocess:(cv::Mat)input {
  self->originalSize = cv::Size(input.cols, input.rows);
  NSArray * inputShape = [module getInputShape: 0];
  NSNumber *widthNumber = inputShape.lastObject;
  NSNumber *heightNumber = inputShape[inputShape.count - 2];
  
  int height = [heightNumber intValue];
  int width = [widthNumber intValue];
  
  
  cv::Size inputSize = cv::Size(height, width);
  cv::Mat resizedInput;
  resizedInput.create(height, width, CV_8UC1);
  cv::resize(input, resizedInput, inputSize);
  
  NSArray *modelInput = [ImageProcessor matToNSArray: resizedInput];
  return modelInput;
}

- (cv::Mat)postprocess:(NSArray *)input {
  NSArray * inputShape = [module getInputShape: 0];
  NSNumber *widthNumber = inputShape.lastObject;
  NSNumber *heightNumber = inputShape[inputShape.count - 2];
  
  int height = [heightNumber intValue];
  int width = [widthNumber intValue];
  
  cv::Mat processedImage = [ImageProcessor arrayToMat: input width:width height:height];
  cv::resize(processedImage, processedImage, originalSize);
  
  return processedImage;
}

- (cv::Mat)runModel:(cv::Mat)input {
  NSArray *modelInput = [self preprocess:input];
  NSError* forwardError = nil;
  NSArray *result = [self forward:modelInput shape:[module getInputShape:0] inputType:[module getInputType:0] error:&forwardError];
  cv::Mat outputImage = [self postprocess:result[0]];
  
  return outputImage;
}

@end
