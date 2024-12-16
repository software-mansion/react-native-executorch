#import "ClassificationModel.h"
#import "opencv2/opencv.hpp"
#import "Utils.h"
#import "Constants.h"
#import "../../utils/ImageProcessor.h"

@implementation ClassificationModel

- (cv::Size)getModelImageSize {
  NSArray * inputShape = [module getInputShape: 0];
  NSNumber *widthNumber = inputShape.lastObject;
  NSNumber *heightNumber = inputShape[inputShape.count - 2];
  
  int height = [heightNumber intValue];
  int width = [widthNumber intValue];
  
  return cv::Size(height, width);
}

- (NSArray *)preprocess:(cv::Mat &)input {
  cv::Size modelImageSize = [self getModelImageSize];
  cv::resize(input, input, modelImageSize);
  
  NSArray *modelInput = [ImageProcessor matToNSArray: input];
  return modelInput;
}

- (NSDictionary *)postprocess:(NSArray *)output {
  output = output[0]; // take the first output tensor
  std::vector<double> outputVector(output.count);

  for (NSUInteger i = 0; i < output.count; ++i) {
    outputVector[i] = [output[i] doubleValue];
  }
  
  std::vector<double> probabilities = softmax(outputVector);
  NSMutableDictionary *result = [NSMutableDictionary dictionary];
  
  for (int i = 0; i < probabilities.size(); ++i) {
    NSString *className = @(imagenet1k_v1_labels[i].c_str());
    NSNumber *probability = @(probabilities[i]);
    result[className] = probability;
  }
  
  return result;
}

- (NSDictionary *)runModel:(cv::Mat &)input {
  NSArray *modelInput = [self preprocess:input];
  NSArray *modelOutput = [self forward:modelInput];
  return [self postprocess:modelOutput];
}

@end
