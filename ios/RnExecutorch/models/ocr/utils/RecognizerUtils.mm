#import "OCRUtils.h"
#import "RecognizerUtils.h"

@implementation RecognizerUtils

+ (CGFloat)calculateRatio:(int)width height:(int)height {
  CGFloat ratio = (CGFloat)width / (CGFloat)height;
  if (ratio < 1.0) {
    ratio = 1.0 / ratio;
  }
  return ratio;
}

+ (cv::Mat)computeRatioAndResize:(cv::Mat)img width:(int)width height:(int)height modelHeight:(int)modelHeight {
  CGFloat ratio = (CGFloat)width / (CGFloat)height;
  if (ratio < 1.0) {
    ratio = [self calculateRatio:width height:height];
    cv::resize(img, img, cv::Size(modelHeight, (int)(modelHeight * ratio)), 0, 0, cv::INTER_LANCZOS4);
  } else {
    cv::resize(img, img, cv::Size((int)(modelHeight * ratio), modelHeight), 0, 0, cv::INTER_LANCZOS4);
  }
  return img;
}

+ (cv::Mat)adjustContrastGrey:(cv::Mat)img target:(double)target {
  double contrast = 0.0;
  int high = 0;
  int low = 255;
  
  for (int i = 0; i < img.rows; ++i) {
    for (int j = 0; j < img.cols; ++j) {
      uchar pixel = img.at<uchar>(i, j);
      high = MAX(high, pixel);
      low = MIN(low, pixel);
    }
  }
  contrast = (high - low) / 255.0;
  
  if (contrast < target) {
    double ratio = 200.0 / MAX(10, high - low);
    img.convertTo(img, CV_32F);
    img = ((img - low + 25) * ratio);
    
    cv::threshold(img, img, 255, 255, cv::THRESH_TRUNC);
    cv::threshold(img, img, 0, 0, cv::THRESH_TOZERO);
    
    img.convertTo(img, CV_8U);
  }
  
  return img;
}

+ (cv::Mat)normalizeForRecognizer:(cv::Mat)image adjustContrast:(double)adjustContrast {
  if (adjustContrast > 0) {
    image = [self adjustContrastGrey:image target:adjustContrast];  }
  
  int desiredWidth = 128;
  if (image.cols >= 512) {
    desiredWidth = 512;
  } else if (image.cols >= 256) {
    desiredWidth = 256;
  }
  
  image = [OCRUtils resizeWithPadding:image desiredWidth:desiredWidth desiredHeight:64];
  
  image.convertTo(image, CV_32F, 1.0 / 255.0);
  image = (image - 0.5) * 2.0;
  
  return image;
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
  
  CGFloat ratio = [self calculateRatio:width height:height];
  int new_width = (int)(modelHeight * ratio);
  
  if (new_width == 0) {
    return crop_img;
  }
  
  crop_img = [self computeRatioAndResize:crop_img width:width height:height modelHeight:modelHeight];
  
  return crop_img;
}

+ (NSMutableArray *)sumProbabilityRows:(cv::Mat)probabilities modelOutputHeight:(int)modelOutputHeight {
  NSMutableArray *predsNorm = [NSMutableArray arrayWithCapacity:probabilities.rows];
  for (int i = 0; i < probabilities.rows; i++) {
    float sum = 0.0;
    for (int j = 0; j < modelOutputHeight; j++) {
      sum += probabilities.at<float>(i, j);
    }
    [predsNorm addObject:@(sum)];
  }
  return predsNorm;
}

+ (NSArray *)findMaxValuesAndIndices:(cv::Mat)probabilities {
  NSMutableArray *valuesArray = [NSMutableArray array];
  NSMutableArray *indicesArray = [NSMutableArray array];
  for (int i = 0; i < probabilities.rows; i++) {
    double maxVal = 0;
    cv::Point maxLoc;
    cv::minMaxLoc(probabilities.row(i), NULL, &maxVal, NULL, &maxLoc);
    [valuesArray addObject:@(maxVal)];
    [indicesArray addObject:@(maxLoc.x)];
  }
  return @[valuesArray, indicesArray];
}

+ (double)computeConfidenceScore:(NSArray<NSNumber *> *)valuesArray indicesArray:(NSArray<NSNumber *> *)indicesArray {
  NSMutableArray *predsMaxProb = [NSMutableArray array];
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
  return pow(product, 2.0 / sqrt(predsMaxProb.count));
}

@end
