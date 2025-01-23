#import "RecognitionHandler.h"
#import <React/RCTBridgeModule.h>
#import "./utils/OCRUtils.h"
#import "../../utils/ImageProcessor.h"
#import "./utils/CTCLabelConverter.h"
#import "ExecutorchLib/ETModel.h"

@implementation RecognitionHandler

- (NSArray<NSNumber *> *)indicesOfMaxValuesInMatrix:(cv::Mat)matrix {
  NSMutableArray<NSNumber *> *maxIndices = [NSMutableArray array];
  
  for (int i = 0; i < matrix.rows; i++) {
    double maxVal;
    cv::Point maxLoc;
    cv::minMaxLoc(matrix.row(i), NULL, &maxVal, NULL, &maxLoc);
    [maxIndices addObject:@(maxLoc.x)];
  }
  
  return [maxIndices copy];
}


- (cv::Mat)divideMatrix:(cv::Mat)matrix byVector:(NSArray<NSNumber *> *)vector {
  cv::Mat result = matrix.clone();
  
  for (int i = 0; i < matrix.rows; i++) {
    float divisor = [vector[i] floatValue];
    for (int j = 0; j < matrix.cols; j++) {
      result.at<float>(i, j) /= divisor;
    }
  }
  
  return result;
}

- (cv::Mat)softmax:(cv::Mat) inputs {
  cv::Mat maxVal;
  cv::reduce(inputs, maxVal, 1, cv::REDUCE_MAX, CV_32F);
  cv::Mat expInputs;
  cv::exp(inputs - cv::repeat(maxVal, 1, inputs.cols), expInputs);
  cv::Mat sumExp;
  cv::reduce(expInputs, sumExp, 1, cv::REDUCE_SUM, CV_32F);
  cv::Mat softmaxOutput = expInputs / cv::repeat(sumExp, 1, inputs.cols);
  return softmaxOutput;
}

- (NSArray *)recognize: (NSArray *)horizontalList imgGray:(cv::Mat)imgGray desiredWidth:(int)desiredWidth desiredHeight:(int)desiredHeight {
  const float newRatioH = (float)desiredHeight / imgGray.rows;
  const float newRatioW = (float)desiredWidth / imgGray.cols;
  float resizeRatio = MIN(newRatioH, newRatioW);
  const int newWidth = imgGray.cols * resizeRatio;
  const int newHeight = imgGray.rows * resizeRatio;
  const int deltaW = desiredWidth - newWidth;
  const int deltaH = desiredHeight - newHeight;
  const int top = deltaH / 2;
  const int left= deltaW / 2;
  float heightRatio = (float)imgGray.rows / desiredHeight;
  float widthRatio = (float)imgGray.cols / desiredWidth;
  resizeRatio = MAX(heightRatio, widthRatio);
  
  NSString *modelPath = [[NSBundle mainBundle] pathForResource:@"xnnpack_crnn_512" ofType:@"pte"];
  ETModel *recognizer_512 = [[ETModel alloc] init];
  [recognizer_512 loadModel:modelPath];
  ETModel *recognizer_256 = [[ETModel alloc] init];
  modelPath = [[NSBundle mainBundle] pathForResource:@"xnnpack_crnn_256" ofType:@"pte"];
  [recognizer_256 loadModel:modelPath];
  ETModel *recognizer_128 = [[ETModel alloc] init];
  modelPath = [[NSBundle mainBundle] pathForResource:@"xnnpack_crnn_128" ofType:@"pte"];
  [recognizer_128 loadModel:modelPath];
  
  imgGray = [OCRUtils resizeWithPadding:imgGray desiredWidth:desiredWidth desiredHeight:desiredHeight];
  NSMutableArray *predictions = [NSMutableArray array];
  for (NSArray *box in horizontalList) {
    int maximum_y = imgGray.rows;
    int maximum_x = imgGray.cols;
    
    int x_min = MAX(0, [box[0] intValue]);
    int x_max = MIN([box[1] intValue], maximum_x);
    int y_min = MAX(0, [box[2] intValue]);
    int y_max = MIN([box[3] intValue], maximum_y);
    cv::Mat croppedImage = [OCRUtils getCroppedImage:x_max x_min:x_min y_max:y_max y_min:y_min image:imgGray modelHeight:64];
    
    
    croppedImage = [OCRUtils normalizeForRecognizer:croppedImage adjustContrast:0.0];
    NSArray* modelInput = [ImageProcessor matToArrayForGrayscale:croppedImage];
    NSArray<NSArray *> *result;
    if(croppedImage.cols >= 512) {
      result = [recognizer_512 forward:modelInput shape:[recognizer_512 getInputShape:0] inputType:[recognizer_512 getInputType:0]];
    } else if (croppedImage.cols >= 256) {
      result = [recognizer_256 forward:modelInput shape:[recognizer_256 getInputShape:0] inputType:[recognizer_256 getInputType:0]];
    } else {
      result = [recognizer_128 forward:modelInput shape:[recognizer_128 getInputShape:0] inputType:[recognizer_128 getInputType:0]];
    }
    
    NSInteger totalNumbers = [result.firstObject count];
    NSInteger numRows = (totalNumbers + 96) / 97;
    
    cv::Mat resultMat = cv::Mat::zeros(numRows, 97, CV_32F);
    
    NSInteger counter = 0;
    NSInteger currentRow = 0;
    
    for (NSNumber *num in result.firstObject) {
      resultMat.at<float>(currentRow, counter) = [num floatValue];
      
      counter++;
      if (counter >= 97) {
        counter = 0;
        currentRow++;
      }
    }
    
    cv::Mat probabilities = [self softmax:resultMat];
    NSMutableArray* pred_norm = [NSMutableArray arrayWithCapacity:probabilities.rows];
    for(int i = 0; i < probabilities.rows; i++) {
      float sum = 0.0;
      for(int j = 0; j < 97; j++) {
        sum += probabilities.at<float>(i, j);
      }
      [pred_norm addObject:@(sum)];
    }
    
    probabilities = [self divideMatrix:probabilities byVector:pred_norm];
    NSString *dictPath = [[NSBundle mainBundle] pathForResource:@"en" ofType:@"txt"];
    CTCLabelConverter *converter = [[CTCLabelConverter alloc] initWithCharacters:@"0123456789!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ €ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" separatorList:@{} dictPathList:@{@"en": dictPath}];
    NSArray* preds_index = [self indicesOfMaxValuesInMatrix:probabilities];
    NSArray* decodedTexts = [converter decodeGreedyWithTextIndex:preds_index length:(int)(preds_index.count)];
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
    NSDictionary *res = @{@"text": decodedTexts[0], @"bbox": @{@"x1": @((int)((x_min - left) * resizeRatio)), @"x2": @((int)((x_max - left) * resizeRatio)), @"y1": @((int)((y_min - top) * resizeRatio)), @"y2":@((int)((y_max - top) * resizeRatio))}, @"score": @(confidenceScore)};
    [predictions addObject:res];
  }
  
  return predictions;
}

@end

