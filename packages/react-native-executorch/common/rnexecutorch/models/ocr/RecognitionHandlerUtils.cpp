#include "RecognitionHandlerUtils.h"
#include <algorithm>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/ocr/Constants.h>

namespace rnexecutorch::ocr {
std::tuple<float, int32_t, int32_t>
calculateResizeRatioAndPaddings(cv::Size size, cv::Size desiredSize) {
  float newRatioH = static_cast<float>(desiredSize.height) / size.height;
  float newRatioW = static_cast<float>(desiredSize.width) / size.width;
  float resizeRatio = std::min(newRatioH, newRatioW);

  int32_t newHeight = static_cast<int32_t>(size.height * resizeRatio);
  int32_t newWidth = static_cast<int32_t>(size.width * resizeRatio);

  int32_t deltaH = desiredSize.height - newHeight;
  int32_t deltaW = desiredSize.width - newWidth;

  int32_t top = deltaH / 2;
  int32_t left = deltaW / 2;

  float heightRatio = static_cast<float>(size.height) / desiredSize.height;
  float widthRatio = static_cast<float>(size.width) / desiredSize.width;

  resizeRatio = std::max(heightRatio, widthRatio);
  return {resizeRatio, top, left};
}
void computeRatioAndResize(cv::Mat &img, cv::Size size, int32_t modelHeight) {
  double ratio =
      static_cast<double>(size.width) / static_cast<double>(size.height);
  cv::Size resizedSize;
  if (ratio < 1.0) {
    ratio = 1.0 / ratio;
    resizedSize =
        cv::Size(modelHeight, static_cast<int32_t>(modelHeight * ratio));
  } else {
    resizedSize =
        cv::Size(static_cast<int32_t>(modelHeight * ratio), modelHeight);
  }
  cv::resize(img, img, resizedSize, 0.0, 0.0, cv::INTER_LANCZOS4);
}

cv::Mat cropImage(DetectorBBox box, cv::Mat &image, int32_t modelHeight) {
  // Convert custom points to cv::Point2f
  std::array<cv::Point2f, 4> points;
  for (size_t i = 0; i < 4; ++i) {
    points[i] = cv::Point2f(box.bbox[i].x, box.bbox[i].y);
  }

  cv::RotatedRect rotatedRect = cv::minAreaRect(points);
  cv::Point2f rectPoints[4];
  rotatedRect.points(rectPoints);

  // Rotate the image
  cv::Point2f imageCenter(image.cols / 2.0f, image.rows / 2.0f);
  cv::Mat rotationMatrix = cv::getRotationMatrix2D(imageCenter, box.angle, 1.0);
  cv::Mat rotatedImage;
  cv::warpAffine(image, rotatedImage, rotationMatrix, image.size(),
                 cv::INTER_LINEAR);

  cv::Mat rectMat(4, 2, CV_32FC2);
  for (int i = 0; i < 4; ++i) {
    rectMat.at<cv::Vec2f>(i, 0) = cv::Vec2f(rectPoints[i].x, rectPoints[i].y);
  }
  cv::transform(rectMat, rectMat, rotationMatrix);

  std::vector<cv::Point2f> transformedPoints(4);
  for (int i = 0; i < 4; ++i) {
    cv::Vec2f point = rectMat.at<cv::Vec2f>(i, 0);
    transformedPoints[i] = cv::Point2f(point[0], point[1]);
  }

  cv::Rect boundingBox = cv::boundingRect(transformedPoints);

  cv::Rect validRegion(0, 0, rotatedImage.cols, rotatedImage.rows);

  boundingBox = boundingBox & validRegion; // OpenCV's built-in intersection

  if (boundingBox.empty()) {
    return cv::Mat(); // Early exit if no valid crop
  }

  cv::Mat croppedImage = rotatedImage(boundingBox).clone();

  computeRatioAndResize(croppedImage,
                        cv::Size(boundingBox.width, boundingBox.height),
                        modelHeight);

  return croppedImage;
}

void adjustContrastGrey(cv::Mat &img, double target) {
  int32_t high = 0, low = 255;
  for (int32_t i = 0; i < img.rows; i++) {
    for (int32_t j = 0; j < img.cols; j++) {
      int32_t pixel = img.at<uchar>(i, j); // Access pixel
      high = std::max(high, pixel);
      low = std::min(low, pixel);
    }
  }
  double contrast = (high - low) / 255.0;
  if (contrast < target) {
    double ratio = 200.0 / std::max(10, high - low);
    cv::Mat tempImg;
    img.convertTo(tempImg, CV_32F);
    tempImg -= (low - 25);
    tempImg *= ratio;

    cv::threshold(tempImg, tempImg, 255.0, 255.0, cv::THRESH_TRUNC);
    cv::threshold(tempImg, tempImg, 0.0, 255.0, cv::THRESH_TOZERO);

    tempImg.convertTo(img, CV_8U);
  }
}

int32_t getDesiredWidth(const cv::Mat &img, bool isVertical) {

  if (img.cols >= largeRecognizerWidth) {
    return largeRecognizerWidth;
  }
  if (img.cols >= mediumRecognizerWidth) {
    return mediumRecognizerWidth;
  }
  return isVertical ? smallVerticalRecognizerWidth : smallRecognizerWidth;
}

cv::Mat normalizeForRecognizer(cv::Mat &image, int32_t modelHeight,
                               double adjustContrast, bool isVertical) {
  auto img = image.clone();
  if (adjustContrast > 0) {
    adjustContrastGrey(img, adjustContrast);
  }
  auto desiredWidth = getDesiredWidth(img, isVertical);
  img = imageprocessing::resizePadded(img, cv::Size(desiredWidth, modelHeight));
  img.convertTo(img, CV_32F, 1.0f / 255.0f); // Scale from 0-255 to [0,1]
                                             // (float)
  img -= 0.5f; // Shift to[-0.5, 0.5]
  img *= 2.0f; // Scale to [-1,1]
  return img;
}
} // namespace rnexecutorch::ocr
