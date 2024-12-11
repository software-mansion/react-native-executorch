#import "StyleTransferModel.h"
#import "../utils/ImageProcessor.h"
#import "opencv2/opencv.hpp"

@implementation StyleTransferModel {
  cv::Size originalSize;
}

- (cv::Size)getModelImageSize{
  NSArray * inputShape = [module getInputShape: 0];
  NSNumber *widthNumber = inputShape.lastObject;
  NSNumber *heightNumber = inputShape[inputShape.count - 2];
  
  int height = [heightNumber intValue];
  int width = [widthNumber intValue];
  
  return cv::Size(height, width);
}

- (NSArray *)preprocess:(cv::Mat &)input {
  self->originalSize = cv::Size(input.cols, input.rows);
  
  cv::Size modelImageSize = [self getModelImageSize];
  cv::resize(input, input, modelImageSize);
  
  NSArray *modelInput = [ImageProcessor matToNSArray: input];
  return modelInput;
}

- (cv::Mat)postprocess:(NSArray *)output {
  cv::Size modelImageSize = [self getModelImageSize];
  cv::Mat processedImage = [ImageProcessor arrayToMat: output width:modelImageSize.width height:modelImageSize.height];
  cv::resize(processedImage, processedImage, originalSize);
  
  return processedImage;
}

- (cv::Mat)runModel:(cv::Mat &)input {
  NSArray *modelInput = [self preprocess:input];
  NSArray *result = [self forward:modelInput];
  input = [self postprocess:result[0]];
  
  return input;
}

@end
