#import "RecognitionHandler.h"
#import <React/RCTBridgeModule.h>
#import "./utils/OCRUtils.h"
#import "../../utils/ImageProcessor.h"
#import "./utils/CTCLabelConverter.h"
#import "ExecutorchLib/ETModel.h"

@implementation RecognitionHandler

- (NSArray<NSNumber *> *)indicesOfMaxValuesInMatrix:(cv::Mat)matrix {
  // Ensure the matrix is 2D and has more than one column to avoid trivial results.
  NSAssert(matrix.dims == 2 && matrix.cols > 1, @"Matrix must be 2D with more than one column.");
  
  NSMutableArray<NSNumber *> *maxIndices = [NSMutableArray array];
  
  // Iterating over each row to find the index of the max element
  for (int i = 0; i < matrix.rows; i++) {
    double maxVal; // Variable to store the maximum value (not used)
    cv::Point maxLoc; // This will store the location of the maximum value
    cv::minMaxLoc(matrix.row(i), NULL, &maxVal, NULL, &maxLoc);
    [maxIndices addObject:@(maxLoc.x)]; // Add the index of the max value to the array
  }
  
  return [maxIndices copy]; // Return an NSArray copy of the mutable array
}


- (cv::Mat)divideMatrix:(cv::Mat)matrix byVector:(NSArray<NSNumber *> *)vector {
  // Ensure the vector's length matches the number of rows in the matrix
  NSAssert(matrix.rows == vector.count, @"Vector length must match number of matrix rows.");
  
  cv::Mat result = matrix.clone(); // Clone the matrix to keep the original unchanged
  
  // Iterate through each element in the matrix and divide by the corresponding vector element
  for (int i = 0; i < matrix.rows; i++) {
    float divisor = [vector[i] floatValue]; // Get the CGFloat value from NSArray
    for (int j = 0; j < matrix.cols; j++) {
      result.at<float>(i, j) /= divisor;
    }
  }
  
  return result;
}

- (cv::Mat)softmax:(cv::Mat) inputs {
  cv::Mat maxVal;
  cv::reduce(inputs, maxVal, 1, cv::REDUCE_MAX, CV_32F); // Find max per row for numerical stability
  cv::Mat expInputs;
  cv::exp(inputs - cv::repeat(maxVal, 1, inputs.cols), expInputs); // Compute exp(values - max)
  cv::Mat sumExp;
  cv::reduce(expInputs, sumExp, 1, cv::REDUCE_SUM, CV_32F); // Sum of exp per row
  cv::Mat softmaxOutput = expInputs / cv::repeat(sumExp, 1, inputs.cols); // Divide by sum(exp)
  return softmaxOutput;
}

- (NSArray *)recognize: (NSArray *)horizontalList imgGray:(cv::Mat)imgGray desiredWidth:(int)desiredWidth desiredHeight:(int)desiredHeight {
  NSLog(@"Before padding");
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
  for (NSArray *box in horizontalList) {
    int maximum_y = imgGray.rows;
    int maximum_x = imgGray.cols;
    
    int x_min = MAX(0, [box[0] intValue]);
    int x_max = MIN([box[1] intValue], maximum_x);
    int y_min = MAX(0, [box[2] intValue]);
    int y_max = MIN([box[3] intValue], maximum_y);
    cv::Mat croppedImage = [OCRUtils getCroppedImage:x_max x_min:x_min y_max:y_max y_min:y_min image:imgGray modelHeight:64];
    
    
    croppedImage = [OCRUtils normalizeForRecognizer:croppedImage adjustContrast:0.0];
    NSArray* modelInput = [ImageProcessor matToNSArrayForGrayscale:croppedImage];
    NSArray<NSArray *> *result;
    if(croppedImage.cols >= 512) {
      result = [recognizer_512 forward:modelInput shape:[recognizer_512 getInputShape:0] inputType:[recognizer_512 getInputType:0]];
    } else if (croppedImage.cols >= 256) {
      result = [recognizer_256 forward:modelInput shape:[recognizer_256 getInputShape:0] inputType:[recognizer_256 getInputType:0]];
    } else {
      result = [recognizer_128 forward:modelInput shape:[recognizer_128 getInputShape:0] inputType:[recognizer_128 getInputType:0]];
    }
    
    NSInteger totalNumbers = [result.firstObject count];
    NSInteger numRows = (totalNumbers + 96) / 97; // Each row has 97 columns, round up if needed
    
    // Initialize the matrix with appropriate size
    cv::Mat resultMat = cv::Mat::zeros(numRows, 97, CV_32F); // 97 columns, floating point values
    
    // Counter for columns and row tracker
    NSInteger counter = 0;
    NSInteger currentRow = 0;
    
    for (NSNumber *num in result.firstObject) {
      // Set the value in the matrix
      resultMat.at<float>(currentRow, counter) = [num floatValue];
      
      counter++;
      if (counter >= 97) {
        counter = 0; // Reset counter if 97 columns are filled
        currentRow++; // Move to the next row
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
    NSLog(@"%@", decodedTexts[0]);
  }
  
  return [NSArray init];
}

@end

