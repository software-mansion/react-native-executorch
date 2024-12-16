#import "StyleTransferModel.h"
#import "../utils/ImageProcessor.h"
#import "opencv2/opencv.hpp"

@implementation StyleTransferModel {
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
  cv::Mat output;
  cv::resize(input, output, modelImageSize);
  
  NSArray *modelInput = [ImageProcessor matToNSArray: output];
  return modelInput;
}

- (cv::Mat)postprocess:(NSArray *)output {
  cv::Size modelImageSize = [self getModelImageSize];
  cv::Mat processedImage = [ImageProcessor arrayToMat: output width:modelImageSize.width height:modelImageSize.height];

  cv::Mat processedOutput;
  cv::resize(processedImage, processedOutput, originalSize);
  
  return processedOutput;
}

- (cv::Mat)runModel:(cv::Mat &)input {
  NSArray *modelInput = [self preprocess:input];
  NSArray *result = [self forward:modelInput];
  input = [self postprocess:result[0]];
  
  return input;
}

@end
