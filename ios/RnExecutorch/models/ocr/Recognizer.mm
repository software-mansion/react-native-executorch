#import "opencv2/opencv.hpp"
#import "Recognizer.h"
#import "../../utils/ImageProcessor.h"
#import "utils/OCRUtils.h"
#import "RecognizerUtils.h"

@implementation Recognizer {
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
  return [NSArray init];
}

- (NSArray *)postprocess:(NSArray *)output {
  NSInteger totalNumbers = [output.firstObject count];
  NSInteger numRows = (totalNumbers + 96) / 97;
  
  cv::Mat resultMat = cv::Mat::zeros(numRows, 97, CV_32F);
  
  NSInteger counter = 0;
  NSInteger currentRow = 0;
  
  for (NSNumber *num in output.firstObject) {
    resultMat.at<float>(currentRow, counter) = [num floatValue];
    
    counter++;
    if (counter >= 97) {
      counter = 0;
      currentRow++;
    }
  }
  
  cv::Mat probabilities = [RecognizerUtils softmax:resultMat];
  NSMutableArray* pred_norm = [NSMutableArray arrayWithCapacity:probabilities.rows];
  for(int i = 0; i < probabilities.rows; i++) {
    float sum = 0.0;
    for(int j = 0; j < 97; j++) {
      sum += probabilities.at<float>(i, j);
    }
    [pred_norm addObject:@(sum)];
  }
  
  probabilities = [RecognizerUtils divideMatrix:probabilities byVector:pred_norm];
  NSArray* preds_index = [RecognizerUtils indicesOfMaxValuesInMatrix:probabilities];
  
  NSMutableArray<NSNumber *> *valuesArray = [NSMutableArray array];
  NSMutableArray<NSNumber *> *indicesArray = [NSMutableArray array];
  for (int i = 0; i < probabilities.rows; i++) {
    double maxVal = 0;
    cv::Point maxLoc;
    cv::minMaxLoc(probabilities.row(i), NULL, &maxVal, NULL, &maxLoc);
    
    [valuesArray addObject:@(maxVal)];
    [indicesArray addObject:@(maxLoc.x)];
  }
  
  NSMutableArray<NSNumber *> *predsMaxProb = [NSMutableArray array];
  
  for (NSUInteger index = 0; index < indicesArray.count; index++) {
    NSNumber *indicator = indicesArray[index];
    if ([indicator intValue] != 0) {
      [predsMaxProb addObject:valuesArray[index]];
    }
  }
  
  
  if (predsMaxProb.count == 0) {
    [predsMaxProb addObject:@(0)];
  }
  
  double product = 1.0;
  for (NSNumber *prob in predsMaxProb) {
    product *= [prob doubleValue];
  }
  
  double confidenceScore = pow(product, 2.0 / sqrt(predsMaxProb.count));
  
  NSMutableArray* result = [[NSMutableArray alloc] init];
  
  [result addObject:preds_index];
  [result addObject: @(confidenceScore)];
  
  return result;
}

- (NSArray *)runModel:(cv::Mat &)input {
  NSArray* modelInput = [ImageProcessor matToArrayForGrayscale:input];
  NSArray *modelResult = [self forward:modelInput];
  NSArray *result = [self postprocess:modelResult];
  
  return result;
}

@end
