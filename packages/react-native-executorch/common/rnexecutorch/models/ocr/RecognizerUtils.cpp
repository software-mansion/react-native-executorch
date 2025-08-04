#include "RecognizerUtils.h"

namespace rnexecutorch::ocr {
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
  for (int i = 0; i < matrix.rows; ++i) {
    sums.push_back(cv::sum(matrix.row(i))[0]);
  }
  return sums;
}

void divideMatrixByRows(cv::Mat &matrix, const std::vector<float> &rowSums) {
  for (int i = 0; i < matrix.rows; ++i) {
    matrix.row(i) /= rowSums[i];
  }
}

MaxValuesAndIndices findMaxValuesIndices(const cv::Mat &mat) {
  CV_Assert(mat.type() == CV_32F);
  MaxValuesAndIndices result{};
  result.values.reserve(mat.rows);
  result.indices.reserve(mat.rows);

  for (int i = 0; i < mat.rows; ++i) {
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

cv::Rect extractBoundingBox(std::array<rnexecutorch::Point, 4> &points) {
  cv::Mat pointsMat(4, 1, CV_32FC2, points.data());
  return cv::boundingRect(pointsMat);
}

cv::Mat cropSingleCharacter(const cv::Mat &img) {
  cv::Mat histogram;
  int histSize = 256;
  float range[] = {0.0f, 256.0f};
  const float *histRange = {range};
  bool uniform = true;
  bool accumulate = false;

  cv::calcHist(&img, 1, 0, cv::Mat(), histogram, 1, &histSize, &histRange,
               uniform, accumulate);

  int midPoint = histSize / 2;
  double sumLeft = 0.0;
  double sumRight = 0.0;
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
  const int numLabels = cv::connectedComponentsWithStats(thresh, labels, stats,
                                                         centroids, 8, CV_32S);

  const int height = thresh.rows;
  const int width = thresh.cols;
  const int minX = ocr::singleCharacterCenterThreshold * width;
  const int maxX = (1 - ocr::singleCharacterCenterThreshold) * width;
  const int minY = ocr::singleCharacterCenterThreshold * height;
  const int maxY = (1 - ocr::singleCharacterCenterThreshold) * height;

  int selectedComponent = -1;

  for (int i = 1; i < numLabels; i++) {
    const int area = stats.at<int>(i, cv::CC_STAT_AREA);
    const double cx = centroids.at<double>(i, 0);
    const double cy = centroids.at<double>(i, 1);

    if ((minX < cx && cx < maxX && minY < cy && cy < maxY &&
         area > ocr::singleCharacterMinSize) &&
        (selectedComponent == -1 ||
         area > stats.at<int>(selectedComponent, cv::CC_STAT_AREA))) {
      selectedComponent = i;
    }
  }

  cv::Mat mask = cv::Mat::zeros(img.size(), CV_8UC1);
  if (selectedComponent != -1) {
    mask = (labels == selectedComponent);
  }

  cv::Mat resultImage = cv::Mat::zeros(img.size(), img.type());
  img.copyTo(resultImage, mask);

  cv::bitwise_not(resultImage, resultImage);

  return resultImage;
}

cv::Mat
cropImageWithBoundingBox(const cv::Mat &img,
                         const std::array<rnexecutorch::Point, 4> &bbox,
                         const std::array<rnexecutorch::Point, 4> &originalBbox,
                         const rnexecutorch::PaddingInfo &paddings,
                         const rnexecutorch::PaddingInfo &originalPaddings) {
  if (originalBbox.empty()) {
    throw std::runtime_error("Original bounding box cannot be empty.");
  }
  const rnexecutorch::Point topLeft = originalBbox[0];

  std::vector<cv::Point2f> points;
  points.reserve(bbox.size());

  for (const auto &point : bbox) {
    rnexecutorch::Point transformedPoint = point;

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
  if (rect.width == 0 || rect.height == 0) {
    return cv::Mat();
  }
  cv::Mat croppedImage = img(rect).clone();

  cv::cvtColor(croppedImage, croppedImage, cv::COLOR_BGR2GRAY);
  cv::resize(croppedImage, croppedImage,
             cv::Size(ocr::smallVerticalRecognizerWidth, ocr::recognizerHeight),
             0, 0, cv::INTER_AREA);

  return croppedImage;
}
} // namespace rnexecutorch::ocr
