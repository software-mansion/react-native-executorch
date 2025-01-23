#import "RecognizerUtils.h"
#import "OCRUtils.h"

@implementation RecognizerUtils

+ (NSArray<NSNumber *> *)indicesOfMaxValuesInMatrix:(cv::Mat)matrix {
  NSMutableArray<NSNumber *> *maxIndices = [NSMutableArray array];
  
  for (int i = 0; i < matrix.rows; i++) {
    double maxVal;
    cv::Point maxLoc;
    cv::minMaxLoc(matrix.row(i), NULL, &maxVal, NULL, &maxLoc);
    [maxIndices addObject:@(maxLoc.x)];
  }
  
  return [maxIndices copy];
}

+ (cv::Mat)divideMatrix:(cv::Mat)matrix byVector:(NSArray<NSNumber *> *)vector {
  cv::Mat result = matrix.clone();
  
  for (int i = 0; i < matrix.rows; i++) {
    float divisor = [vector[i] floatValue];
    for (int j = 0; j < matrix.cols; j++) {
      result.at<float>(i, j) /= divisor;
    }
  }
  
  return result;
}

+ (cv::Mat)softmax:(cv::Mat) inputs {
  cv::Mat maxVal;
  cv::reduce(inputs, maxVal, 1, cv::REDUCE_MAX, CV_32F);
  cv::Mat expInputs;
  cv::exp(inputs - cv::repeat(maxVal, 1, inputs.cols), expInputs);
  cv::Mat sumExp;
  cv::reduce(expInputs, sumExp, 1, cv::REDUCE_SUM, CV_32F);
  cv::Mat softmaxOutput = expInputs / cv::repeat(sumExp, 1, inputs.cols);
  return softmaxOutput;
}

+ (NSDictionary *)calculateResizeRatioAndPaddings:(int)width height:(int)height desiredWidth:(int)desiredWidth desiredHeight:(int)desiredHeight {
  const float newRatioH = (float)desiredHeight / height;
  const float newRatioW = (float)desiredWidth / width;
  float resizeRatio = MIN(newRatioH, newRatioW);
  const int newWidth = width * resizeRatio;
  const int newHeight = height * resizeRatio;
  const int deltaW = desiredWidth - newWidth;
  const int deltaH = desiredHeight - newHeight;
  const int top = deltaH / 2;
  const int left = deltaW / 2;
  float heightRatio = (float)height / desiredHeight;
  float widthRatio = (float)width / desiredWidth;
  
  resizeRatio = MAX(heightRatio, widthRatio);
  
  return @{
    @"resizeRatio": @(resizeRatio),
    @"top": @(top),
    @"left": @(left),
  };
}

+ (cv::Mat)getCroppedImage:(int)x_max x_min:(int)x_min y_max:(int)y_max y_min:(int)y_min image:(cv::Mat)image modelHeight:(int)modelHeight {
  cv::Rect region(x_min, y_min, x_max - x_min, y_max - y_min);
  cv::Mat crop_img = image(region);
  
  int width = x_max - x_min;
  int height = y_max - y_min;
  
  CGFloat ratio = [OCRUtils calculateRatioWithWidth:width height:height];
  int new_width = (int)(modelHeight * ratio);
  
  if (new_width == 0) {
    return crop_img;
  }
  
  crop_img = [OCRUtils computeRatioAndResize:crop_img width:width height:height modelHeight:modelHeight];
  
  return crop_img;
}

@end
