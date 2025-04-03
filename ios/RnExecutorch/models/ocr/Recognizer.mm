#import "Recognizer.h"
#import "../../utils/ImageProcessor.h"
#import "RecognizerUtils.h"
#import "utils/OCRUtils.h"

/*
 The model used as detector is based on CRNN paper.
 https://arxiv.org/pdf/1507.05717
 */

@implementation Recognizer {
  cv::Size originalSize;
}

- (cv::Size)getModelImageSize {
  NSArray *inputShape = [module getInputShape:@0];
  NSNumber *widthNumber = inputShape.lastObject;
  NSNumber *heightNumber = inputShape[inputShape.count - 2];

  const int height = [heightNumber intValue];
  const int width = [widthNumber intValue];
  return cv::Size(height, width);
}

- (cv::Size)getModelOutputSize {
  NSArray *outputShape = [module getOutputShape:@0];
  NSNumber *widthNumber = outputShape.lastObject;
  NSNumber *heightNumber = outputShape[outputShape.count - 2];

  const int height = [heightNumber intValue];
  const int width = [widthNumber intValue];
  return cv::Size(height, width);
}

- (NSArray *)preprocess:(cv::Mat &)input {
  return [ImageProcessor matToNSArrayGray:input];
}

- (NSArray *)postprocess:(NSArray *)output {
  const int modelOutputHeight = [self getModelOutputSize].height;
  NSInteger numElements = [output.firstObject count];
  NSInteger numRows = (numElements + modelOutputHeight - 1) / modelOutputHeight;
  cv::Mat resultMat = cv::Mat::zeros(numRows, modelOutputHeight, CV_32F);
  NSInteger counter = 0;
  NSInteger currentRow = 0;
  for (NSNumber *num in output.firstObject) {
    resultMat.at<float>(currentRow, counter) = [num floatValue];
    counter++;
    if (counter >= modelOutputHeight) {
      counter = 0;
      currentRow++;
    }
  }

  cv::Mat probabilities = [RecognizerUtils softmax:resultMat];
  NSMutableArray *predsNorm =
      [RecognizerUtils sumProbabilityRows:probabilities
                        modelOutputHeight:modelOutputHeight];
  probabilities = [RecognizerUtils divideMatrix:probabilities
                                       byVector:predsNorm];
  NSArray *maxValuesIndices =
      [RecognizerUtils findMaxValuesAndIndices:probabilities];
  const CGFloat confidenceScore =
      [RecognizerUtils computeConfidenceScore:maxValuesIndices[0]
                                 indicesArray:maxValuesIndices[1]];

  return @[ maxValuesIndices[1], @(confidenceScore) ];
}

- (NSArray *)runModel:(cv::Mat &)input {
  NSArray *modelInput = [self preprocess:input];
  NSArray *modelResult = [self forward:@[ modelInput ]];
  NSArray *result = [self postprocess:modelResult];

  return result;
}

@end
