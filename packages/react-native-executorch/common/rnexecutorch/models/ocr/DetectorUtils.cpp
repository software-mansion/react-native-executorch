#include "DetectorUtils.h"
#include <algorithm>
#include <limits>
#include <numeric>
#include <rnexecutorch/models/ocr/Constants.h>
#include <rnexecutorch/models/ocr/Types.h>
#include <unordered_set>
namespace rnexecutorch::ocr {

std::pair<cv::Mat, cv::Mat> interleavedArrayToMats(std::span<const float> data,
                                                   cv::Size size) {
  cv::Mat mat1 = cv::Mat(size.height, size.width, CV_32F);
  cv::Mat mat2 = cv::Mat(size.height, size.width, CV_32F);

  for (std::size_t i = 0; i < data.size(); i++) {
    const float value = data[i];
    const int x = (i / 2) % size.width;
    const int y = (i / 2) / size.width;

    if (i % 2 == 0) {
      mat1.at<float>(y, x) = value;
    } else {
      mat2.at<float>(y, x) = value;
    }
  }
  return {mat1, mat2};
}

std::vector<DetectorBBox> getDetBoxesFromTextMap(cv::Mat &textMap,
                                                 cv::Mat &affinityMap,
                                                 float textThreshold,
                                                 float linkThreshold,
                                                 float lowTextThreshold) {
  const int imgH = textMap.rows;
  const int imgW = textMap.cols;
  cv::Mat textScore;
  cv::Mat affinityScore;
  cv::threshold(textMap, textScore, textThreshold, 1, cv::THRESH_BINARY);
  cv::threshold(affinityMap, affinityScore, linkThreshold, 1,
                cv::THRESH_BINARY);
  cv::Mat textScoreComb = textScore + affinityScore;
  cv::threshold(textScoreComb, textScoreComb, 0, 1, cv::THRESH_BINARY);
  cv::Mat binaryMat;
  textScoreComb.convertTo(binaryMat, CV_8UC1);

  cv::Mat labels, stats, centroids;
  const int nLabels =
      cv::connectedComponentsWithStats(binaryMat, labels, stats, centroids, 4);

  std::vector<DetectorBBox> detectedBoxes;
  for (int i = 1; i < nLabels; i++) {
    const int area = stats.at<int>(i, cv::CC_STAT_AREA);
    if (area < 10)
      continue;

    cv::Mat mask = (labels == i);
    double maxVal;
    cv::minMaxLoc(textMap, nullptr, &maxVal, nullptr, nullptr, mask);
    if (maxVal < lowTextThreshold) {
      continue;
    }

    cv::Mat segMap = cv::Mat::zeros(textMap.size(), CV_8U);
    segMap.setTo(255, mask);

    const int x = stats.at<int>(i, cv::CC_STAT_LEFT);
    const int y = stats.at<int>(i, cv::CC_STAT_TOP);
    const int w = stats.at<int>(i, cv::CC_STAT_WIDTH);
    const int h = stats.at<int>(i, cv::CC_STAT_HEIGHT);
    const int dilationRadius = (int)(sqrt((double)(area / MAX(w, h))) * 2.0);
    const int sx = MAX(x - dilationRadius, 0);
    const int ex = MIN(x + w + dilationRadius + 1, imgW);
    const int sy = MAX(y - dilationRadius, 0);
    const int ey = MIN(y + h + dilationRadius + 1, imgH);

    cv::Rect roi(sx, sy, ex - sx, ey - sy);
    cv::Mat kernel = cv::getStructuringElement(
        cv::MORPH_RECT, cv::Size(1 + dilationRadius, 1 + dilationRadius));
    cv::Mat roiSegMap = segMap(roi);
    cv::dilate(roiSegMap, roiSegMap, kernel);

    std::vector<std::vector<cv::Point>> contours;
    cv::findContours(segMap, contours, cv::RETR_EXTERNAL,
                     cv::CHAIN_APPROX_SIMPLE);
    if (!contours.empty()) {
      cv::RotatedRect minRect = cv::minAreaRect(contours[0]);
      cv::Point2f vertices[4];
      minRect.points(vertices);
      std::array<Point, 4> points;
#pragma unroll
      for (int j = 0; j < 4; j++) {
        points[j] = {.x = vertices[j].x, .y = vertices[j].y};
      }
      detectedBoxes.push_back({.bbox = points, .angle = minRect.angle});
    }
  }

  return detectedBoxes;
}

std::vector<DetectorBBox>
getDetBoxesFromTextMapVertical(cv::Mat &textMap, cv::Mat &affinityMap,
                               float textThreshold, float linkThreshold,
                               bool independentCharacters) {

  // Ensure input mats are of the correct type for processing
  CV_Assert(textMap.type() == CV_32F && affinityMap.type() == CV_32F);

  const int imgH = textMap.rows;
  const int imgW = textMap.cols;

  // 1. Threshold the text and affinity maps to create binary masks
  cv::Mat textScore, affinityScore;
  cv::threshold(textMap, textScore, textThreshold, 1.0, cv::THRESH_BINARY);
  cv::threshold(affinityMap, affinityScore, linkThreshold, 1.0,
                cv::THRESH_BINARY);

  // 2. Combine maps based on whether we are detecting words or single
  // characters
  cv::Mat textScoreComb;
  if (independentCharacters) {
    // For single characters, subtract affinity to separate adjacent chars
    textScoreComb = textScore - affinityScore;
    // Clamp values to be >= 0
    cv::threshold(textScoreComb, textScoreComb, 0.0, 1.0, cv::THRESH_TOZERO);
    // Clamp values to be <= 1
    cv::threshold(textScoreComb, textScoreComb, 1.0, 1.0, cv::THRESH_TRUNC);

    // Perform morphological operations to refine character regions
    cv::Mat kernel = cv::getStructuringElement(cv::MORPH_RECT, cv::Size(3, 3));
    cv::erode(textScoreComb, textScoreComb, kernel, cv::Point(-1, -1), 1);
    cv::dilate(textScoreComb, textScoreComb, kernel, cv::Point(-1, -1), 4);
  } else {
    // For words, add affinity to link characters together
    textScoreComb = textScore + affinityScore;
    // Clamp values to be >= 0
    cv::threshold(textScoreComb, textScoreComb, 0.0, 1.0, cv::THRESH_TOZERO);
    // Clamp values to be <= 1
    cv::threshold(textScoreComb, textScoreComb, 1.0, 1.0, cv::THRESH_TRUNC);

    // Dilate to connect word components
    cv::Mat kernel = cv::getStructuringElement(cv::MORPH_RECT, cv::Size(3, 3));
    cv::dilate(textScoreComb, textScoreComb, kernel, cv::Point(-1, -1), 2);
  }

  // 3. Find connected components to identify each character/word
  cv::Mat binaryMat;
  textScoreComb.convertTo(binaryMat, CV_8UC1);

  cv::Mat labels, stats, centroids;
  const int nLabels = cv::connectedComponentsWithStats(binaryMat, labels, stats,
                                                       centroids, 4, CV_32S);

  std::vector<DetectorBBox> detectedBoxes;
  for (int i = 1; i < nLabels; ++i) { // Start from 1 to skip background
    const int area = stats.at<int>(i, cv::CC_STAT_AREA);
    if (area < 20) {
      continue;
    }

    const int width = stats.at<int>(i, cv::CC_STAT_WIDTH);
    const int height = stats.at<int>(i, cv::CC_STAT_HEIGHT);

    // For vertical text (not single chars), height should be greater than width
    if (!independentCharacters && height < width) {
      continue;
    }

    // 4. For each component, create a mask and find its contour
    cv::Mat mask = (labels == i);

    // Create a segmentation map for the current component
    cv::Mat segMap = cv::Mat::zeros(textMap.size(), CV_8U);
    segMap.setTo(255, mask);

    const int x = stats.at<int>(i, cv::CC_STAT_LEFT);
    const int y = stats.at<int>(i, cv::CC_STAT_TOP);
    const int w = stats.at<int>(i, cv::CC_STAT_WIDTH);
    const int h = stats.at<int>(i, cv::CC_STAT_HEIGHT);

    // Dynamically calculate dilation radius to expand the bounding box slightly
    const int dilationRadius = static_cast<int>(
        std::sqrt(static_cast<double>(area) / std::max(w, h)) * 2.0);
    const int sx = std::max(x - dilationRadius, 0);
    const int ex = std::min(x + w + dilationRadius + 1, imgW);
    const int sy = std::max(y - dilationRadius, 0);
    const int ey = std::min(y + h + dilationRadius + 1, imgH);

    // Define a region of interest (ROI) and dilate it
    cv::Rect roi(sx, sy, ex - sx, ey - sy);
    cv::Mat kernel = cv::getStructuringElement(
        cv::MORPH_RECT, cv::Size(1 + dilationRadius, 1 + dilationRadius));
    cv::Mat roiSegMap = segMap(roi);
    cv::dilate(roiSegMap, roiSegMap, kernel, cv::Point(-1, -1), 2);

    // 5. Find the minimum area rotated rectangle around the contour
    std::vector<std::vector<cv::Point>> contours;
    cv::findContours(segMap, contours, cv::RETR_EXTERNAL,
                     cv::CHAIN_APPROX_SIMPLE);

    if (!contours.empty()) {
      cv::RotatedRect minRect = cv::minAreaRect(contours[0]);

      cv::Point2f vertices[4];
      minRect.points(vertices);

      std::array<Point, 4> points;
#pragma unroll
      for (int j = 0; j < 4; j++) {
        points[j] = {.x = vertices[j].x, .y = vertices[j].y};
      }
      detectedBoxes.push_back({.bbox = points, .angle = minRect.angle});
    }
  }

  return detectedBoxes;
}

void restoreBboxRatio(std::vector<DetectorBBox> &boxes, float restoreRatio) {
  for (auto &box : boxes) {
    for (auto &point : box.bbox) {
      point.x *= restoreRatio;
      point.y *= restoreRatio;
    }
  }
}

float distanceFromPoint(const Point &p1, const Point &p2) {
  const float xDist = (p2.x - p1.x);
  const float yDist = (p2.y - p1.y);
  return std::sqrt(xDist * xDist + yDist * yDist);
}

float maxSideLength(const std::array<Point, 4> &points) {
  float maxSideLength = 0;
  int32_t numOfPoints = points.size();
  for (std::size_t i = 0; i < numOfPoints; i++) {
    const auto currentPoint = points[i];
    const auto nextPoint = points[(i + 1) % numOfPoints];

    const float sideLength = distanceFromPoint(currentPoint, nextPoint);
    if (sideLength > maxSideLength) {
      maxSideLength = sideLength;
    }
  }
  return maxSideLength;
}

float normalizeAngle(float angle) {
  if (angle > 45.0f) {
    return angle - 90.0f;
  }
  return angle;
}

Point midpointBetweenPoint(const Point &p1, const Point &p2) {
  return {.x = std::midpoint(p1.x, p2.x), .y = std::midpoint(p1.y, p2.y)};
}

Point centerOfBox(const std::array<Point, 4> &box) {
  return midpointBetweenPoint(box[0], box[2]);
}

float minSideLength(const std::array<Point, 4> &points) {
  float minSideLength = std::numeric_limits<float>::max();
  std::size_t numOfPoints = points.size();

#pragma unroll
  for (std::size_t i = 0; i < numOfPoints; i++) {
    const Point currentPoint = points[i];
    const Point nextPoint = points[(i + 1) % numOfPoints];

    const float sideLength = distanceFromPoint(currentPoint, nextPoint);
    if (sideLength < minSideLength) {
      minSideLength = sideLength;
    }
  }

  return minSideLength;
}

/**
 * This method calculates the distances between each sequential pair of points
 * in a presumed quadrilateral, identifies the two shortest sides, and fits a
 * linear model to the midpoints of these sides. It also evaluates whether the
 * resulting line should be considered vertical based on a predefined threshold
 * for the x-coordinate differences.
 *
 * If the line is vertical it is fitted as a function of x = my + c, otherwise
 * as y = mx + c.
 *
 * @return A tuple with 2 floats and a bool, where:
 *   - the first float represents the slope (m) of the line.
 *   - the second float represents the line's intercept (c) with y-axis.
 *   - a bool indicating whether the line is
 * considered vertical.
 */
std::tuple<float, float, bool>
fitLineToShortestSides(std::array<Point, 4> points) {
  std::array<std::pair<float, float>, 4> sides;
  std::array<Point, 4> midpoints;
#pragma unroll
  for (std::size_t i = 0; i < 4; i++) {
    const auto p1 = points[i];
    const auto p2 = points[(i + 1) % 4];

    const float sideLength = distanceFromPoint(p1, p2);
    sides[i] = std::make_pair(sideLength, i);
    midpoints[i] = midpointBetweenPoint(p1, p2);
  }

  // Sort the sides by length ascending
  std::sort(sides.begin(), sides.end());

  const Point midpoint1 = midpoints[sides[0].second];
  const Point midpoint2 = midpoints[sides[1].second];
  const float dx = std::fabs(midpoint2.x - midpoint1.x);

  float m, c;
  bool isVertical;

  std::vector<cv::Point2f> cvMidPoints = {
      cv::Point2f(midpoint1.x, midpoint1.y),
      cv::Point2f(midpoint2.x, midpoint2.y)};
  cv::Vec4f line;

  if (dx < verticalLineThreshold) {
    for (auto &pt : cvMidPoints) {
      std::swap(pt.x, pt.y);
    }
    cv::fitLine(cvMidPoints, line, cv::DIST_L2, 0, 0.01, 0.01);
    m = line[1] / line[0];
    c = line[3] - m * line[2];
    isVertical = true;
  } else {
    cv::fitLine(cvMidPoints, line, cv::DIST_L2, 0, 0.01, 0.01);
    m = line[1] / line[0];
    c = line[3] - m * line[2];
    isVertical = false;
  }

  return {m, c, isVertical};
}

std::array<Point, 4> rotateBox(const std::array<Point, 4> box, float angle) {
  const Point center = centerOfBox(box);

  const float radians = angle * M_PI / 180.0;

  std::array<Point, 4> rotatedPoints;
  for (std::size_t i = 0; i < box.size(); ++i) {
    const Point &point = box[i];
    const float translatedX = point.x - center.x;
    const float translatedY = point.y - center.y;

    const float rotatedX =
        translatedX * std::cos(radians) - translatedY * std::sin(radians);
    const float rotatedY =
        translatedX * std::sin(radians) + translatedY * std::cos(radians);

    const Point rotatedPoint = {.x = rotatedX + center.x,
                                .y = rotatedY + center.y};
    rotatedPoints[i] = rotatedPoint;
  }

  return rotatedPoints;
}

float calculateMinimalDistanceBetweenBox(const std::array<Point, 4> &box1,
                                         const std::array<Point, 4> &box2) {
  float minDistance = std::numeric_limits<float>::max();
  for (const Point &corner1 : box1) {
    for (const Point &corner2 : box2) {
      const float distance = distanceFromPoint(corner1, corner2);
      if (distance < minDistance) {
        minDistance = distance;
      }
    }
  }
  return minDistance;
}

/**
 * Orders a set of points in a clockwise direction starting with the top-left
 * point.
 *
 * Process:
 * 1. It iterates through each Point.
 * 2. For each point, it calculates the sum (x + y) and difference (y - x) of
 * the coordinates.
 * 3. Points are classified into:
 *    - Top-left: Minimum sum.
 *    - Bottom-right: Maximum sum.
 *    - Top-right: Minimum difference.
 *    - Bottom-left: Maximum difference.
 * 4. The points are ordered starting from the top-left in a clockwise manner:
 * top-left, top-right, bottom-right, bottom-left.
 */
std::array<Point, 4> orderPointsClockwise(const std::array<Point, 4> &points) {
  Point topLeft, topRight, bottomRight, bottomLeft;
  float minSum = std::numeric_limits<float>::max();
  float maxSum = std::numeric_limits<float>::lowest();
  float minDiff = std::numeric_limits<float>::max();
  float maxDiff = std::numeric_limits<float>::lowest();

  for (const auto &pt : points) {
    const float sum = pt.x + pt.y;
    const float diff = pt.y - pt.x;

    if (sum < minSum) {
      minSum = sum;
      topLeft = pt;
    }
    if (sum > maxSum) {
      maxSum = sum;
      bottomRight = pt;
    }
    if (diff < minDiff) {
      minDiff = diff;
      topRight = pt;
    }
    if (diff > maxDiff) {
      maxDiff = diff;
      bottomLeft = pt;
    }
  }

  return {topLeft, topRight, bottomRight, bottomLeft};
}

std::vector<cv::Point2f>
cvPointsFromPoints(const std::array<Point, 4> &points) {
  std::vector<cv::Point2f> cvPoints;
  for (const Point &point : points) {
    cvPoints.emplace_back(point.x, point.y);
  }
  return cvPoints;
}

std::array<Point, 4> pointsFromCvPoints(cv::Point2f cvPoints[4]) {
  std::array<Point, 4> points;
#pragma unroll
  for (std::size_t i = 0; i < 4; ++i) {
    points[i] = {.x = cvPoints[i].x, .y = cvPoints[i].y};
  }
  return points;
}

std::array<Point, 4> mergeRotatedBoxes(std::array<Point, 4> &box1,
                                       std::array<Point, 4> &box2) {
  box1 = orderPointsClockwise(box1);
  box2 = orderPointsClockwise(box2);

  std::vector<cv::Point2f> points1 = cvPointsFromPoints(box1);
  std::vector<cv::Point2f> points2 = cvPointsFromPoints(box2);

  std::vector<cv::Point2f> allPoints;
  allPoints.insert(allPoints.end(), points1.begin(), points1.end());
  allPoints.insert(allPoints.end(), points2.begin(), points2.end());

  std::vector<int> hullIndices;
  cv::convexHull(allPoints, hullIndices, false);

  std::vector<cv::Point2f> hullPoints;
  for (int idx : hullIndices) {
    hullPoints.push_back(allPoints[idx]);
  }

  cv::RotatedRect minAreaRect = cv::minAreaRect(hullPoints);

  cv::Point2f rectPoints[4];
  minAreaRect.points(rectPoints);

  return pointsFromCvPoints(rectPoints);
}

/**
 * This method assesses each box from a provided vector, checks its center
 * against the center of a "current box", and evaluates its alignment with a
 * specified line equation. The function specifically searches for the box whose
 * center is closest to the current box that has not been ignored, and fits
 * within a defined distance from the line.
 *
 * @param boxes A vector of DetectorBBoxes
 * @param ignoredIdxs A set of indices of boxes to ignore in the evaluation.
 * @param currentBox Array of points encapsulating representing the current box
 * to compare against.
 * @param isVertical A boolean indicating if the line to compare distance to is
 * vertical.
 * @param m The slope (gradient) of the line against which the box's alignment
 * is checked.
 * @param c The y-intercept of the line equation y = mx + c.
 * @param centerThreshold A multiplier to determine the threshold for the
 * distance between the box's center and the line.
 *
 * @return A an optional pair containing:
 *         - the index of the found box in the original vector.
 *         - the length of the shortest side of the found box.
 * If no suitable box is found the optional is null.
 */
std::optional<std::pair<std::size_t, float>>
findClosestBox(const std::vector<DetectorBBox> &boxes,
               const std::unordered_set<std::size_t> &ignoredIdxs,
               const std::array<Point, 4> &currentBox, bool isVertical, float m,
               float c, float centerThreshold) {
  float smallestDistance = std::numeric_limits<float>::max();
  std::size_t idx = -1;
  float boxHeight = 0;
  const Point centerOfCurrentBox = centerOfBox(currentBox);

  for (std::size_t i = 0; i < boxes.size(); i++) {
    if (ignoredIdxs.contains(i)) {
      continue;
    }
    std::array<Point, 4> bbox = boxes[i].bbox;
    const Point centerOfProcessedBox = centerOfBox(bbox);
    const float distanceBetweenCenters =
        distanceFromPoint(centerOfCurrentBox, centerOfProcessedBox);

    if (distanceBetweenCenters >= smallestDistance) {
      continue;
    }

    boxHeight = minSideLength(bbox);

    const float lineDistance =
        (isVertical ? std::fabs(centerOfProcessedBox.x -
                                (m * centerOfProcessedBox.y + c))
                    : std::fabs(centerOfProcessedBox.y -
                                (m * centerOfProcessedBox.x + c)));

    if (lineDistance < boxHeight * centerThreshold) {
      idx = i;
      smallestDistance = distanceBetweenCenters;
    }
  }

  return idx != -1 ? std::optional(std::make_pair(idx, boxHeight))
                   : std::nullopt;
}

std::vector<DetectorBBox>
removeSmallBoxesFromArray(const std::vector<DetectorBBox> &boxes,
                          float minSideThreshold, float maxSideThreshold) {
  std::vector<DetectorBBox> filteredBoxes;

  for (const auto &box : boxes) {
    const float maxSide = maxSideLength(box.bbox);
    const float minSide = minSideLength(box.bbox);
    if (minSide > minSideThreshold && maxSide > maxSideThreshold) {
      filteredBoxes.push_back(box);
    }
  }

  return filteredBoxes;
}

static float minimumYFromBox(const std::array<Point, 4> &box) {
  float minY = std::numeric_limits<float>::max();
  for (const auto &pt : box) {
    if (pt.y < minY) {
      minY = pt.y;
    }
  }
  return minY;
}

std::vector<DetectorBBox>
groupTextBoxes(std::vector<DetectorBBox> &boxes, float centerThreshold,
               float distanceThreshold, float heightThreshold,
               int32_t minSideThreshold, int32_t maxSideThreshold,
               int32_t maxWidth) {
  // Sort boxes descending by maximum side length
  std::sort(boxes.begin(), boxes.end(),
            [](const DetectorBBox &lhs, const DetectorBBox &rhs) {
              return maxSideLength(lhs.bbox) > maxSideLength(rhs.bbox);
            });

  std::vector<DetectorBBox> mergedVec;
  float lineAngle;
  while (!boxes.empty()) {
    auto currentBox = boxes[0];
    float normalizedAngle = normalizeAngle(currentBox.angle);
    boxes.erase(boxes.begin());
    std::unordered_set<std::size_t> ignoredIdxs;

    while (true) {
      // Find all aligned boxes and merge them until max_size is reached or no
      // more boxes can be merged
      auto [slope, intercept, isVertical] =
          fitLineToShortestSides(currentBox.bbox);

      lineAngle = std::atan(slope) * 180 / M_PI;
      if (isVertical) {
        lineAngle = -90;
      }

      auto closestBoxInfo =
          findClosestBox(boxes, ignoredIdxs, currentBox.bbox, isVertical, slope,
                         intercept, centerThreshold);
      if (!closestBoxInfo)
        break;

      std::size_t candidateIdx = closestBoxInfo.value().first;
      DetectorBBox candidateBox = boxes[candidateIdx];
      const float candidateHeight = closestBoxInfo.value().second;

      if ((candidateBox.angle == 90 && !isVertical) ||
          (candidateBox.angle == 0 && isVertical)) {
        candidateBox.bbox = rotateBox(candidateBox.bbox, normalizedAngle);
      }

      const float minDistance = calculateMinimalDistanceBetweenBox(
          candidateBox.bbox, currentBox.bbox);
      const float mergedHeight = minSideLength(currentBox.bbox);
      if (minDistance < distanceThreshold * candidateHeight &&
          fabs(mergedHeight - candidateHeight) <
              candidateHeight * heightThreshold) {
        currentBox.bbox = mergeRotatedBoxes(currentBox.bbox, candidateBox.bbox);
        boxes.erase(boxes.begin() + candidateIdx);
        ignoredIdxs.clear();
        if (maxSideLength(currentBox.bbox) > maxWidth) {
          break;
        }
      } else {
        ignoredIdxs.insert(candidateIdx);
      }
    }

    mergedVec.emplace_back(currentBox.bbox, lineAngle);
  }

  // Remove small boxes and sort by vertical
  mergedVec =
      removeSmallBoxesFromArray(mergedVec, minSideThreshold, maxSideThreshold);

  std::sort(mergedVec.begin(), mergedVec.end(),
            [](const auto &obj1, const auto &obj2) {
              const auto &coords1 = obj1.bbox;
              const auto &coords2 = obj2.bbox;
              const float minY1 = minimumYFromBox(coords1);
              const float minY2 = minimumYFromBox(coords2);
              return minY1 < minY2;
            });

  std::vector<DetectorBBox> orderedSortedBoxes;
  orderedSortedBoxes.reserve(mergedVec.size());
  for (DetectorBBox bbox : mergedVec) {
    bbox.bbox = orderPointsClockwise(bbox.bbox);
    orderedSortedBoxes.push_back(bbox);
  }

  return orderedSortedBoxes;
}

} // namespace rnexecutorch::ocr
