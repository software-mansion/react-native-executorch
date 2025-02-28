#import "OCRUtils.h"
#import "RecognizerUtils.h"

@implementation OCRUtils

+ (cv::Mat)resizeWithPadding:(cv::Mat)img
                desiredWidth:(int)desiredWidth
               desiredHeight:(int)desiredHeight {
  const int height = img.rows;
  const int width = img.cols;
  const float heightRatio = (float)desiredHeight / height;
  const float widthRatio = (float)desiredWidth / width;
  const float resizeRatio = MIN(heightRatio, widthRatio);

  const int newWidth = width * resizeRatio;
  const int newHeight = height * resizeRatio;

  cv::Mat resizedImg;
  cv::resize(img, resizedImg, cv::Size(newWidth, newHeight), 0, 0,
             cv::INTER_AREA);

  const int cornerPatchSize = MAX(1, MIN(height, width) / 30);
  std::vector<cv::Mat> corners = {
      img(cv::Rect(0, 0, cornerPatchSize, cornerPatchSize)),
      img(cv::Rect(width - cornerPatchSize, 0, cornerPatchSize,
                   cornerPatchSize)),
      img(cv::Rect(0, height - cornerPatchSize, cornerPatchSize,
                   cornerPatchSize)),
      img(cv::Rect(width - cornerPatchSize, height - cornerPatchSize,
                   cornerPatchSize, cornerPatchSize))};

  cv::Scalar backgroundScalar = cv::mean(corners[0]);
  for (int i = 1; i < corners.size(); i++) {
    backgroundScalar += cv::mean(corners[i]);
  }
  backgroundScalar /= (double)corners.size();

  backgroundScalar[0] = cvFloor(backgroundScalar[0]);
  backgroundScalar[1] = cvFloor(backgroundScalar[1]);
  backgroundScalar[2] = cvFloor(backgroundScalar[2]);

  const int deltaW = desiredWidth - newWidth;
  const int deltaH = desiredHeight - newHeight;
  const int top = deltaH / 2;
  const int bottom = deltaH - top;
  const int left = deltaW / 2;
  const int right = deltaW - left;

  cv::Mat centeredImg;
  cv::copyMakeBorder(resizedImg, centeredImg, top, bottom, left, right,
                     cv::BORDER_CONSTANT, backgroundScalar);

  return centeredImg;
}

+ (cv::Rect)extractBoundingBox:(NSArray *)coords {
  std::vector<cv::Point2f> points;
  points.reserve(coords.count);
  for (NSValue *value in coords) {
    const CGPoint point = [value CGPointValue];

    points.emplace_back(point.x, point.y);
  }

  return cv::boundingRect(points);
}

@end
