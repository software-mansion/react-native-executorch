#include "RecognizerUtils.h"

namespace rnexecutorch::models::ocr::utils {
cv::Mat softmax(const cv::Mat &inputs) {
  cv::Mat maxVal;
  cv::reduce(inputs, maxVal, 1, cv::REDUCE_MAX, CV_32F);
  cv::Mat expInputs;
  cv::exp(inputs - cv::repeat(maxVal, 1, inputs.cols), expInputs);
  cv::Mat sumExp;
  cv::reduce(expInputs, sumExp, 1, cv::REDUCE_SUM, CV_32F);
  cv::Mat softmaxOutput = expInputs / cv::repeat(sumExp, 1, inputs.cols);

  return softmaxOutput;
}

std::vector<float> sumProbabilityRows(const cv::Mat &matrix) {
  std::vector<float> sums;
  sums.reserve(matrix.rows);
  for (int32_t i = 0; i < matrix.rows; ++i) {
    sums.push_back(cv::sum(matrix.row(i))[0]);
  }
  return sums;
}

void divideMatrixByRows(cv::Mat &matrix, const std::vector<float> &rowSums) {
  for (int32_t i = 0; i < matrix.rows; ++i) {
    matrix.row(i) /= rowSums[i];
  }
}

types::ValuesAndIndices findMaxValuesIndices(const cv::Mat &mat) {
  CV_Assert(mat.type() == CV_32F);
  types::ValuesAndIndices result{};
  result.values.reserve(mat.rows);
  result.indices.reserve(mat.rows);

  for (int32_t i = 0; i < mat.rows; ++i) {
    double maxVal;
    cv::Point maxLoc;
    cv::minMaxLoc(mat.row(i), nullptr, &maxVal, nullptr, &maxLoc);
    result.values.push_back(static_cast<float>(maxVal));
    result.indices.push_back(maxLoc.x);
  }

  return result;
}

float confidenceScore(const std::vector<float> &values,
                      const std::vector<int32_t> &indices) {
  float product = 1.0f;
  int32_t count = 0;

  for (size_t i = 0; i < indices.size(); ++i) {
    if (indices[i] != 0) {
      product *= values[i];
      count++;
    }
  }

  if (count == 0) {
    return 0.0f;
  }

  const float n = static_cast<float>(count);
  const float exponent = 2.0f / std::sqrt(n);
  return std::pow(product, exponent);
}

cv::Rect extractBoundingBox(std::array<types::Point, 4> &points) {
  cv::Mat pointsMat(4, 1, CV_32FC2, points.data());
  return cv::boundingRect(pointsMat);
}

cv::Mat characterBitMask(const cv::Mat &img) {
  // 1. Determine if character is darker/lighter than background.
  cv::Mat histogram;
  int32_t histSize = 256;
  float range[] = {0.0f, 256.0f};
  const float *histRange = {range};
  bool uniform = true;
  bool accumulate = false;

  cv::calcHist(&img, 1, 0, cv::Mat(), histogram, 1, &histSize, &histRange,
               uniform, accumulate);

  // Compare sum of darker (left half) vs brighter (right half) pixels.
  const int32_t midPoint = histSize / 2;
  double sumLeft = 0.0;
  double sumRight = 0.0;
  for (int32_t i = 0; i < midPoint; i++) {
    sumLeft += histogram.at<float>(i);
  }
  for (int32_t i = midPoint; i < histSize; i++) {
    sumRight += histogram.at<float>(i);
  }
  const int32_t thresholdType =
      (sumLeft < sumRight) ? cv::THRESH_BINARY_INV : cv::THRESH_BINARY;

  // 2. Binarize using Otsu's method (auto threshold).
  cv::Mat thresh;
  cv::threshold(img, thresh, 0, 255, thresholdType + cv::THRESH_OTSU);

  // 3. Find the largest connected component near the center.
  cv::Mat labels, stats, centroids;
  const int32_t numLabels = cv::connectedComponentsWithStats(
      thresh, labels, stats, centroids, 8, CV_32S);

  const int32_t height = thresh.rows;
  const int32_t width = thresh.cols;
  const int32_t minX = constants::kSingleCharacterCenterThreshold * width;
  const int32_t maxX = (1 - constants::kSingleCharacterCenterThreshold) * width;
  const int32_t minY = constants::kSingleCharacterCenterThreshold * height;
  const int32_t maxY =
      (1 - constants::kSingleCharacterCenterThreshold) * height;

  int32_t selectedComponent = -1;
  int32_t maxArea = -1;
  for (int32_t i = 1; i < numLabels; i++) { // Skip background (label 0)
    const int32_t area = stats.at<int32_t>(i, cv::CC_STAT_AREA);
    const double cx = centroids.at<double>(i, 0);
    const double cy = centroids.at<double>(i, 1);

    if ((minX < cx && cx < maxX && minY < cy &&
         cy < maxY &&                                  // check if centered
         area > constants::kSingleCharacterMinSize) && // check if large enough
        area > maxArea) {
      selectedComponent = i;
      maxArea = area;
    }
  }
  // 4. Extract the character and invert to white-on-black.
  cv::Mat resultImage;
  cv::Mat mask;
  if (selectedComponent != -1) {
    mask = (labels == selectedComponent);
    img.copyTo(resultImage, mask);
  } else {
    resultImage = cv::Mat::zeros(img.size(), img.type());
  }

  cv::bitwise_not(resultImage, resultImage);

  return resultImage;
}

cv::Mat
cropImageWithBoundingBox(const cv::Mat &img,
                         const std::array<types::Point, 4> &bbox,
                         const std::array<types::Point, 4> &originalBbox,
                         const types::PaddingInfo &paddings,
                         const types::PaddingInfo &originalPaddings) {
  if (originalBbox.empty()) {
    throw std::runtime_error("Original bounding box cannot be empty.");
  }
  const types::Point topLeft = originalBbox[0];

  std::vector<cv::Point2f> points;
  points.reserve(bbox.size());

  for (const auto &point : bbox) {
    types::Point transformedPoint = point;

    transformedPoint.x -= paddings.left;
    transformedPoint.y -= paddings.top;

    transformedPoint.x *= paddings.resizeRatio;
    transformedPoint.y *= paddings.resizeRatio;

    transformedPoint.x += topLeft.x;
    transformedPoint.y += topLeft.y;

    transformedPoint.x -= originalPaddings.left;
    transformedPoint.y -= originalPaddings.top;

    transformedPoint.x *= originalPaddings.resizeRatio;
    transformedPoint.y *= originalPaddings.resizeRatio;

    points.emplace_back(transformedPoint.x, transformedPoint.y);
  }

  cv::Rect rect = cv::boundingRect(points);
  rect &= cv::Rect(0, 0, img.cols, img.rows);
  if (rect.empty()) {
    return {};
  }
  auto croppedImage = img(rect).clone();
  return croppedImage;
}

cv::Mat prepareForRecognition(const cv::Mat &originalImage,
                              const std::array<types::Point, 4> &bbox,
                              const std::array<types::Point, 4> &originalBbox,
                              const types::PaddingInfo &paddings,
                              const types::PaddingInfo &originalPaddings) {
  auto croppedChar = cropImageWithBoundingBox(originalImage, bbox, originalBbox,
                                              paddings, originalPaddings);
  cv::cvtColor(croppedChar, croppedChar, cv::COLOR_BGR2GRAY);
  cv::resize(croppedChar, croppedChar,
             cv::Size(constants::kSmallVerticalRecognizerWidth,
                      constants::kRecognizerHeight),
             0, 0, cv::INTER_AREA);
  return croppedChar;
}
} // namespace rnexecutorch::models::ocr::utils
