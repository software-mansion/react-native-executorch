#include "RecognitionHandlerUtils.h"
#include <algorithm>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/ocr/Constants.h>

namespace rnexecutorch::models::ocr::utils {
types::PaddingInfo calculateResizeRatioAndPaddings(cv::Size size,
                                                   cv::Size desiredSize) {
  const auto newRatioH = static_cast<float>(desiredSize.height) / size.height;
  const auto newRatioW = static_cast<float>(desiredSize.width) / size.width;
  auto resizeRatio = std::min(newRatioH, newRatioW);

  const auto newHeight = static_cast<int32_t>(size.height * resizeRatio);
  const auto newWidth = static_cast<int32_t>(size.width * resizeRatio);

  const int32_t deltaH = desiredSize.height - newHeight;
  const int32_t deltaW = desiredSize.width - newWidth;

  const int32_t top = deltaH / 2;
  const int32_t left = deltaW / 2;

  const auto heightRatio = static_cast<float>(size.height) / desiredSize.height;
  const auto widthRatio = static_cast<float>(size.width) / desiredSize.width;

  resizeRatio = std::max(heightRatio, widthRatio);
  return {resizeRatio, top, left};
}

void computeRatioAndResize(cv::Mat &img, cv::Size size, int32_t modelHeight) {
  auto ratio =
      static_cast<double>(size.width) / static_cast<double>(size.height);
  cv::Size resizedSize;
  if (ratio < 1.0) {
    resizedSize =
        cv::Size(modelHeight, static_cast<int32_t>(modelHeight / ratio));
  } else {
    resizedSize =
        cv::Size(static_cast<int32_t>(modelHeight * ratio), modelHeight);
  }
  cv::resize(img, img, resizedSize, 0.0, 0.0, cv::INTER_LANCZOS4);
}

cv::Mat cropImage(types::DetectorBBox box, cv::Mat &image,
                  int32_t modelHeight) {
  // Convert custom points to cv::Point2f
  std::array<cv::Point2f, 4> points;
#pragma unroll
  for (std::size_t i = 0; i < points.size(); ++i) {
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
#pragma unroll
  for (int32_t i = 0; i < rectMat.rows; ++i) {
    rectMat.at<cv::Vec2f>(i, 0) = cv::Vec2f(rectPoints[i].x, rectPoints[i].y);
  }
  cv::transform(rectMat, rectMat, rotationMatrix);

  std::vector<cv::Point2f> transformedPoints(4);
#pragma unroll
  for (std::size_t i = 0; i < transformedPoints.size(); ++i) {
    cv::Vec2f point = rectMat.at<cv::Vec2f>(i, 0);
    transformedPoints[i] = cv::Point2f(point[0], point[1]);
  }

  cv::Rect boundingBox = cv::boundingRect(transformedPoints);

  cv::Rect validRegion(0, 0, rotatedImage.cols, rotatedImage.rows);

  boundingBox = boundingBox & validRegion; // OpenCV's built-in intersection

  if (boundingBox.empty()) {
    return {};
  }

  cv::Mat croppedImage = rotatedImage(boundingBox).clone();

  computeRatioAndResize(croppedImage,
                        cv::Size(boundingBox.width, boundingBox.height),
                        modelHeight);

  return croppedImage;
}

void adjustContrastGrey(cv::Mat &img, double target) {
  constexpr double minValue = 0.0;
  constexpr double maxValue = 255.0;

  // calculate the brightest and the darkest point from the img
  double highDouble;
  double lowDouble;
  cv::minMaxLoc(img, &lowDouble, &highDouble);
  const auto low = static_cast<int32_t>(lowDouble);
  const auto high = static_cast<int32_t>(highDouble);

  double contrast = (highDouble - lowDouble) / maxValue;
  if (contrast < target) {
    constexpr double maxStretchIntensity = 200.0;
    constexpr int32_t minRangeClamp = 10;
    // Defines how much the contrast will actually stretch.
    // Formula obtained empirically.
    double ratio = maxStretchIntensity / std::max(minRangeClamp, high - low);
    cv::Mat tempImg;
    img.convertTo(tempImg, CV_32F);
    constexpr int32_t histogramShift = 25;

    tempImg -= (low - histogramShift);
    tempImg *= ratio;

    cv::threshold(tempImg, tempImg, maxValue, maxValue, cv::THRESH_TRUNC);
    cv::threshold(tempImg, tempImg, minValue, maxValue, cv::THRESH_TOZERO);

    tempImg.convertTo(img, CV_8U);
  }
}

int32_t getDesiredWidth(const cv::Mat &img, bool isVertical) {

  if (img.cols >= constants::kLargeRecognizerWidth) {
    return constants::kLargeRecognizerWidth;
  }
  if (img.cols >= constants::kMediumRecognizerWidth) {
    return constants::kMediumRecognizerWidth;
  }
  return isVertical ? constants::kSmallVerticalRecognizerWidth
                    : constants::kSmallRecognizerWidth;
}

cv::Mat normalizeForRecognizer(const cv::Mat &image, int32_t modelHeight,
                               double adjustContrast, bool isVertical) {
  auto img = image.clone();
  if (adjustContrast > 0.0) {
    adjustContrastGrey(img, adjustContrast);
  }

  int32_t desiredWidth = getDesiredWidth(image, isVertical);

  img =
      image_processing::resizePadded(img, cv::Size(desiredWidth, modelHeight));
  img.convertTo(img, CV_32F, 1.0f / 255.0f);
  img -= 0.5f;
  img *= 2.0f;
  return img;
}
} // namespace rnexecutorch::models::ocr::utils
