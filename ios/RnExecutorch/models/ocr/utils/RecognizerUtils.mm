#import "RecognizerUtils.h"
#import "Constants.h"
#import "OCRUtils.h"

@implementation RecognizerUtils

+ (CGFloat)calculateRatio:(int)width height:(int)height {
  CGFloat ratio = (CGFloat)width / (CGFloat)height;
  if (ratio < 1.0) {
    ratio = 1.0 / ratio;
  }
  return ratio;
}

+ (cv::Mat)computeRatioAndResize:(cv::Mat)img
                           width:(int)width
                          height:(int)height
                     modelHeight:(int)modelHeight {
  CGFloat ratio = (CGFloat)width / (CGFloat)height;
  if (ratio < 1.0) {
    ratio = [self calculateRatio:width height:height];
    cv::resize(img, img, cv::Size(modelHeight, (int)(modelHeight * ratio)), 0,
               0, cv::INTER_LANCZOS4);
  } else {
    cv::resize(img, img, cv::Size((int)(modelHeight * ratio), modelHeight), 0,
               0, cv::INTER_LANCZOS4);
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
    const double ratio = 200.0 / MAX(10, high - low);
    img.convertTo(img, CV_32F);
    img = ((img - low + 25) * ratio);

    cv::threshold(img, img, 255, 255, cv::THRESH_TRUNC);
    cv::threshold(img, img, 0, 0, cv::THRESH_TOZERO);

    img.convertTo(img, CV_8U);
  }

  return img;
}

+ (cv::Mat)normalizeForRecognizer:(cv::Mat)image
                   adjustContrast:(double)adjustContrast
                       isVertical:(BOOL)isVertical {
  if (adjustContrast > 0) {
    image = [self adjustContrastGrey:image target:adjustContrast];
  }

  int desiredWidth =
      (isVertical) ? smallVerticalRecognizerWidth : smallRecognizerWidth;

  if (image.cols >= largeRecognizerWidth) {
    desiredWidth = largeRecognizerWidth;
  } else if (image.cols >= mediumRecognizerWidth) {
    desiredWidth = mediumRecognizerWidth;
  }

  image = [OCRUtils resizeWithPadding:image
                         desiredWidth:desiredWidth
                        desiredHeight:recognizerHeight];

  image.convertTo(image, CV_32F, 1.0 / 255.0);
  image = (image - 0.5) * 2.0;

  return image;
}

+ (cv::Mat)divideMatrix:(cv::Mat)matrix byVector:(NSArray<NSNumber *> *)vector {
  cv::Mat result = matrix.clone();

  for (int i = 0; i < matrix.rows; i++) {
    const float divisor = [vector[i] floatValue];
    for (int j = 0; j < matrix.cols; j++) {
      result.at<float>(i, j) /= divisor;
    }
  }

  return result;
}

+ (cv::Mat)softmax:(cv::Mat)inputs {
  cv::Mat maxVal;
  cv::reduce(inputs, maxVal, 1, cv::REDUCE_MAX, CV_32F);
  cv::Mat expInputs;
  cv::exp(inputs - cv::repeat(maxVal, 1, inputs.cols), expInputs);
  cv::Mat sumExp;
  cv::reduce(expInputs, sumExp, 1, cv::REDUCE_SUM, CV_32F);
  cv::Mat softmaxOutput = expInputs / cv::repeat(sumExp, 1, inputs.cols);
  return softmaxOutput;
}

+ (NSDictionary *)calculateResizeRatioAndPaddings:(int)width
                                           height:(int)height
                                     desiredWidth:(int)desiredWidth
                                    desiredHeight:(int)desiredHeight {
  const float newRatioH = (float)desiredHeight / height;
  const float newRatioW = (float)desiredWidth / width;
  float resizeRatio = MIN(newRatioH, newRatioW);
  const int newWidth = width * resizeRatio;
  const int newHeight = height * resizeRatio;
  const int deltaW = desiredWidth - newWidth;
  const int deltaH = desiredHeight - newHeight;
  const int top = deltaH / 2;
  const int left = deltaW / 2;
  const float heightRatio = (float)height / desiredHeight;
  const float widthRatio = (float)width / desiredWidth;

  resizeRatio = MAX(heightRatio, widthRatio);

  return @{
    @"resizeRatio" : @(resizeRatio),
    @"top" : @(top),
    @"left" : @(left),
  };
}

+ (cv::Mat)getCroppedImage:(NSDictionary *)box
                     image:(cv::Mat)image
               modelHeight:(int)modelHeight {
  NSArray *coords = box[@"bbox"];
  const CGFloat angle = [box[@"angle"] floatValue];

  std::vector<cv::Point2f> points;
  for (NSValue *value in coords) {
    const CGPoint point = [value CGPointValue];
    points.emplace_back(static_cast<float>(point.x),
                        static_cast<float>(point.y));
  }

  cv::RotatedRect rotatedRect = cv::minAreaRect(points);

  cv::Point2f imageCenter = cv::Point2f(image.cols / 2.0, image.rows / 2.0);
  cv::Mat rotationMatrix = cv::getRotationMatrix2D(imageCenter, angle, 1.0);
  cv::Mat rotatedImage;
  cv::warpAffine(image, rotatedImage, rotationMatrix, image.size(),
                 cv::INTER_LINEAR);
  cv::Point2f rectPoints[4];
  rotatedRect.points(rectPoints);
  std::vector<cv::Point2f> transformedPoints(4);
  cv::Mat rectMat(4, 2, CV_32FC2, rectPoints);
  cv::transform(rectMat, rectMat, rotationMatrix);

  for (int i = 0; i < 4; ++i) {
    transformedPoints[i] = rectPoints[i];
  }

  cv::Rect boundingBox = cv::boundingRect(transformedPoints);
  boundingBox &= cv::Rect(0, 0, rotatedImage.cols, rotatedImage.rows);
  cv::Mat croppedImage = rotatedImage(boundingBox);
  if (boundingBox.width == 0 || boundingBox.height == 0) {
    croppedImage = cv::Mat().empty();

    return croppedImage;
  }

  croppedImage = [self computeRatioAndResize:croppedImage
                                       width:boundingBox.width
                                      height:boundingBox.height
                                 modelHeight:modelHeight];

  return croppedImage;
}

+ (NSMutableArray *)sumProbabilityRows:(cv::Mat)probabilities
                     modelOutputHeight:(int)modelOutputHeight {
  NSMutableArray *predsNorm =
      [NSMutableArray arrayWithCapacity:probabilities.rows];
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
  return @[ valuesArray, indicesArray ];
}

+ (double)computeConfidenceScore:(NSArray<NSNumber *> *)valuesArray
                    indicesArray:(NSArray<NSNumber *> *)indicesArray {
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

+ (cv::Mat)cropImageWithBoundingBox:(cv::Mat &)img
                               bbox:(NSArray *)bbox
                       originalBbox:(NSArray *)originalBbox
                           paddings:(NSDictionary *)paddings
                   originalPaddings:(NSDictionary *)originalPaddings {
  CGPoint topLeft = [originalBbox[0] CGPointValue];
  std::vector<cv::Point2f> points;
  points.reserve(bbox.count);
  for (NSValue *coords in bbox) {
    CGPoint point = [coords CGPointValue];

    point.x = point.x - [paddings[@"left"] intValue];
    point.y = point.y - [paddings[@"top"] intValue];

    point.x = point.x * [paddings[@"resizeRatio"] floatValue];
    point.y = point.y * [paddings[@"resizeRatio"] floatValue];

    point.x = point.x + topLeft.x;
    point.y = point.y + topLeft.y;

    point.x = point.x - [originalPaddings[@"left"] intValue];
    point.y = point.y - [originalPaddings[@"top"] intValue];

    point.x = point.x * [originalPaddings[@"resizeRatio"] floatValue];
    point.y = point.y * [originalPaddings[@"resizeRatio"] floatValue];

    points.emplace_back(cv::Point2f(point.x, point.y));
  }

  cv::Rect rect = cv::boundingRect(points);
  cv::Mat croppedImage = img(rect);
  cv::cvtColor(croppedImage, croppedImage, cv::COLOR_BGR2GRAY);
  cv::resize(croppedImage, croppedImage,
             cv::Size(smallVerticalRecognizerWidth, recognizerHeight), 0, 0,
             cv::INTER_AREA);
  cv::medianBlur(img, img, 1);
  return croppedImage;
}

+ (cv::Mat)cropSingleCharacter:(cv::Mat)img {

  cv::Mat histogram;

  int histSize = 256;
  float range[] = {0, 256};
  const float *histRange = {range};
  bool uniform = true, accumulate = false;

  cv::calcHist(&img, 1, 0, cv::Mat(), histogram, 1, &histSize, &histRange,
               uniform, accumulate);

  int midPoint = histSize / 2;

  double sumLeft = 0.0, sumRight = 0.0;
  for (int i = 0; i < midPoint; i++) {
    sumLeft += histogram.at<float>(i);
  }
  for (int i = midPoint; i < histSize; i++) {
    sumRight += histogram.at<float>(i);
  }

  const int thresholdType =
      (sumLeft < sumRight) ? cv::THRESH_BINARY_INV : cv::THRESH_BINARY;

  cv::Mat thresh;
  cv::threshold(img, thresh, 0, 255, thresholdType + cv::THRESH_OTSU);

  cv::Mat labels, stats, centroids;
  const int numLabels =
      connectedComponentsWithStats(thresh, labels, stats, centroids, 8);
  const CGFloat centralThreshold = singleCharacterCenterThreshold;
  const int height = thresh.rows;
  const int width = thresh.cols;

  const int minX = centralThreshold * width;
  const int maxX = (1 - centralThreshold) * width;
  const int minY = centralThreshold * height;
  const int maxY = (1 - centralThreshold) * height;

  int selectedComponent = -1;

  for (int i = 1; i < numLabels; i++) {
    const int area = stats.at<int>(i, cv::CC_STAT_AREA);
    const double cx = centroids.at<double>(i, 0);
    const double cy = centroids.at<double>(i, 1);

    if (minX < cx && cx < maxX && minY < cy && cy < maxY &&
        area > singleCharacterMinSize) {
      if (selectedComponent == -1 ||
          area > stats.at<int>(selectedComponent, cv::CC_STAT_AREA)) {
        selectedComponent = i;
      }
    }
  }
  cv::Mat mask = cv::Mat::zeros(img.size(), CV_8UC1);
  if (selectedComponent != -1) {
    mask = (labels == selectedComponent) / 255;
  }
  cv::Mat resultImage = cv::Mat::zeros(img.size(), img.type());
  img.copyTo(resultImage, mask);
  cv::bitwise_not(resultImage, resultImage);
  return resultImage;
}

@end
