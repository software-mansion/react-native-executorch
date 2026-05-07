#include "DetectorUtils.h"
#include <algorithm>
#include <limits>
#include <numeric>
#include <rnexecutorch/data_processing/Numerical.h>
#include <rnexecutorch/models/ocr/Constants.h>
#include <rnexecutorch/models/ocr/Types.h>
#include <unordered_set>

namespace rnexecutorch::models::ocr::utils {
static std::array<types::Point, 4> bboxToCorners(const types::BBox &bbox) {
  return {bbox.p1, {bbox.p2.x, bbox.p1.y}, bbox.p2, {bbox.p1.x, bbox.p2.y}};
}

std::pair<cv::Mat, cv::Mat> interleavedArrayToMats(std::span<const float> data,
                                                   cv::Size size) {
  cv::Mat mat1 = cv::Mat(size, CV_32F);
  cv::Mat mat2 = cv::Mat(size, CV_32F);

  for (std::size_t i = 0; i < data.size(); i++) {
    const float value = data[i];
    const int32_t x = (i / 2) % size.width;
    const int32_t y = (i / 2) / size.width;

    if (i % 2 == 0) {
      mat1.at<float>(y, x) = value;
    } else {
      mat2.at<float>(y, x) = value;
    }
  }
  return {mat1, mat2};
}

// Create a segmentation map for the current component.
// Background is 0, (black), foreground is 255 (white)
cv::Mat createSegmentMap(const cv::Mat &mask, cv::Size mapSize,
                         const int32_t segmentColor = 255) {
  cv::Mat segMap = cv::Mat::zeros(mapSize, CV_8U);
  segMap.setTo(segmentColor, mask);
  return segMap;
}

void morphologicalOperations(
    const cv::Mat &segMap, const cv::Mat &stats, int32_t i, int32_t area,
    int32_t imgW, int32_t imgH,
    int32_t iterations = 1, // iterations number of times dilation is  applied.
    cv::Size anchor =
        cv::Point(-1, -1) // anchor position of the anchor within the element;
                          // default means that the anchor is at the center.
) {
  const int32_t x = stats.at<int32_t>(i, cv::CC_STAT_LEFT);
  const int32_t y = stats.at<int32_t>(i, cv::CC_STAT_TOP);
  const int32_t w = stats.at<int32_t>(i, cv::CC_STAT_WIDTH);
  const int32_t h = stats.at<int32_t>(i, cv::CC_STAT_HEIGHT);

  // Dynamically calculate dilation radius to expand the bounding box slightly
  constexpr int32_t evenMultiplyCoeff = 2; // ensure that dilationRadius is even
  const int32_t dilationRadius = static_cast<int32_t>(
      std::sqrt(static_cast<double>(area) / std::max(w, h)) *
      evenMultiplyCoeff);
  const int32_t sx = std::max(x - dilationRadius, 0);
  const int32_t ex = std::min(x + w + dilationRadius, imgW);
  const int32_t sy = std::max(y - dilationRadius, 0);
  const int32_t ey = std::min(y + h + dilationRadius, imgH);

  // Define a region of interest (ROI) and dilate it
  cv::Rect roi(sx, sy, ex - sx, ey - sy);
  // Morphological kernels require minimum size of 1x1 (no-op) plus dilation
  // radius
  const int32_t morphologicalKernelSize =
      1 + dilationRadius; // Ensures valid odd-sized kernel,
                          // notice the fact that dilationRadius is always even.
  cv::Mat kernel = cv::getStructuringElement(
      cv::MORPH_RECT,
      cv::Size(morphologicalKernelSize, morphologicalKernelSize));
  cv::Mat roiSegMap = segMap(roi);
  cv::dilate(roiSegMap, roiSegMap, kernel, anchor, iterations);
}

types::DetectorBBox
extractMinAreaBBoxFromContour(const std::vector<cv::Point> contour) {
  cv::RotatedRect minRect = cv::minAreaRect(contour);

  std::array<cv::Point2f, 4> vertices;
  minRect.points(vertices.data());

  float minX =
      std::min({vertices[0].x, vertices[1].x, vertices[2].x, vertices[3].x});
  float minY =
      std::min({vertices[0].y, vertices[1].y, vertices[2].y, vertices[3].y});
  float maxX =
      std::max({vertices[0].x, vertices[1].x, vertices[2].x, vertices[3].x});
  float maxY =
      std::max({vertices[0].y, vertices[1].y, vertices[2].y, vertices[3].y});
  types::BBox bbox = {{minX, minY}, {maxX, maxY}};
  return {.bbox = bbox, .angle = minRect.angle};
}

void getBoxFromContour(cv::Mat &segMap,
                       std::vector<types::DetectorBBox> &detectedBoxes) {
  std::vector<std::vector<cv::Point>> contours;
  cv::findContours(segMap, contours, cv::RETR_EXTERNAL,
                   cv::CHAIN_APPROX_SIMPLE);
  if (!contours.empty()) {
    detectedBoxes.emplace_back(extractMinAreaBBoxFromContour(contours[0]));
  }
}

// Function for processing single component. It is shared between the
// VerticalOCR and standard OCR. param isVertical specifies which OCR uses it.
// param lowTextThreshold is used only by standard OCR.
void processComponent(const cv::Mat &textMap, const cv::Mat &labels,
                      const cv::Mat &stats, int32_t i, int32_t imgW,
                      int32_t imgH,
                      std::vector<types::DetectorBBox> &detectedBoxes,
                      bool isVertical, int32_t minimalAreaThreshold,
                      int32_t dilationIter, float lowTextThreshold = 0.0) {
  const int32_t area = stats.at<int32_t>(i, cv::CC_STAT_AREA);
  // Skip small components as they are likely to be just noise
  if (area < minimalAreaThreshold) {
    return;
  }

  cv::Mat mask = (labels == i);

  if (!isVertical) {
    // Skip components with low values, as they are likely to be just noise
    double maxVal;
    cv::minMaxLoc(textMap, nullptr, &maxVal, nullptr, nullptr, mask);
    if (maxVal < lowTextThreshold) {
      return;
    }
  }

  cv::Mat segMap = createSegmentMap(mask, textMap.size());

  // Perform morphological operations on  the segment map.
  // mostly includes the dilation of the region of interest
  // to esnure the box captures the whole area
  morphologicalOperations(segMap, stats, i, area, imgW, imgH, dilationIter);

  // Find the minimum area rotated rectangle around the contour
  // and add it to the box list.
  getBoxFromContour(segMap, detectedBoxes);
}

std::vector<types::DetectorBBox>
getDetBoxesFromTextMap(cv::Mat &textMap, cv::Mat &affinityMap,
                       float textThreshold, float linkThreshold,
                       float lowTextThreshold) {
  // Ensure input mats are of the correct type for processing
  CV_Assert(textMap.type() == CV_32F && affinityMap.type() == CV_32F);

  const int32_t imgH = textMap.rows;
  const int32_t imgW = textMap.cols;
  cv::Mat textScore;
  cv::Mat affinityScore;

  // 1. Based on maps and threshold values create binary masks
  constexpr double maxValBinaryMask = 1.0;
  cv::threshold(textMap, textScore, textThreshold, maxValBinaryMask,
                cv::THRESH_BINARY);
  cv::threshold(affinityMap, affinityScore, linkThreshold, maxValBinaryMask,
                cv::THRESH_BINARY);

  // 2. Merge two maps into one using logical OR
  cv::Mat textScoreComb = textScore + affinityScore;
  constexpr double threshVal = 0.0;
  cv::threshold(textScoreComb, textScoreComb, threshVal, maxValBinaryMask,
                cv::THRESH_BINARY);
  cv::Mat binaryMat;
  textScoreComb.convertTo(binaryMat, CV_8UC1);

  // 3. Find connected components to identify each box
  cv::Mat labels, stats, centroids;
  constexpr int32_t connectivityType = 4;
  const int32_t nLabels = cv::connectedComponentsWithStats(
      binaryMat, labels, stats, centroids, connectivityType);

  std::vector<types::DetectorBBox> detectedBoxes;
  detectedBoxes.reserve(nLabels); // Pre-allocate memory

  // number of dilation iterations performed in some
  // morphological operations on a component later on.
  constexpr int32_t dilationIter = 1;
  // minimal accepted area of component
  constexpr int32_t minimalAreaThreshold = 10;

  // 4. Process each component; omit component 0 as it is background
  for (int32_t i = 1; i < nLabels; i++) {
    processComponent(textMap, labels, stats, i, imgW, imgH, detectedBoxes,
                     false, minimalAreaThreshold, dilationIter,
                     lowTextThreshold);
  }

  return detectedBoxes;
}

std::vector<types::DetectorBBox>
getDetBoxesFromTextMapVertical(cv::Mat &textMap, cv::Mat &affinityMap,
                               float textThreshold, float linkThreshold,
                               bool independentCharacters) {
  // Ensure input mats are of the correct type for processing
  CV_Assert(textMap.type() == CV_32F && affinityMap.type() == CV_32F);

  const int32_t imgH = textMap.rows;
  const int32_t imgW = textMap.cols;
  cv::Mat textScore;
  cv::Mat affinityScore;

  // 1. Threshold text and affinity maps to create binary masks
  constexpr double maxValBinaryMask = 1.0;
  cv::threshold(textMap, textScore, textThreshold, maxValBinaryMask,
                cv::THRESH_BINARY);
  cv::threshold(affinityMap, affinityScore, linkThreshold, maxValBinaryMask,
                cv::THRESH_BINARY);

  // Prepare values for morphological operations
  const auto kSize = cv::Size(3, 3); // size of the structuring element
  cv::Mat kernel = cv::getStructuringElement(cv::MORPH_RECT, kSize);

  // iterations number of times erosion is applied.
  constexpr int32_t erosionIterations = 1;

  // iterations number of times dilation is applied.
  int32_t dilationIterations;
  const auto anchor =
      cv::Point(-1, -1); // anchor position of the anchor within the element;
                         // default value (-1, -1)
                         // means that the anchor is at the element center

  // 2. Combine maps based on whether we are detecting words or single
  // characters
  // For single characters, subtract affinity to separate adjacent chars,
  // otherwise add affinity to link characters together
  cv::Mat textScoreComb = independentCharacters ? textScore - affinityScore
                                                : textScore + affinityScore;
  // Clamp values to be >= 0
  cv::threshold(textScoreComb, textScoreComb, 0.0, 1.0, cv::THRESH_TOZERO);
  // Clamp values to be <= 1
  cv::threshold(textScoreComb, textScoreComb, 1.0, 1.0, cv::THRESH_TRUNC);

  // Perform morphological operations to refine character regions
  if (independentCharacters) {
    dilationIterations = 4;
    cv::erode(textScoreComb, textScoreComb, kernel, anchor, erosionIterations);
  } else {
    dilationIterations = 2;
  }
  cv::dilate(textScoreComb, textScoreComb, kernel, anchor, dilationIterations);

  // 3. Find connected components to identify each character/word
  cv::Mat binaryMat;
  textScoreComb.convertTo(binaryMat, CV_8UC1);

  cv::Mat labels, stats, centroids;
  constexpr int32_t connectivityType = 4;
  const int32_t nLabels = cv::connectedComponentsWithStats(
      binaryMat, labels, stats, centroids, connectivityType);

  std::vector<types::DetectorBBox> detectedBoxes;
  detectedBoxes.reserve(nLabels);

  // number of dilation iterations performed in some
  // morphological operations on a component later on.
  constexpr int32_t dilationIter = 2;
  // minimal accepted area of component
  constexpr int32_t minimalAreaThreshold = 20;

  // 4. Process each component; omit component 0 as it is background
  for (int32_t i = 1; i < nLabels; ++i) {
    const int32_t width = stats.at<int32_t>(i, cv::CC_STAT_WIDTH);
    const int32_t height = stats.at<int32_t>(i, cv::CC_STAT_HEIGHT);
    // For vertical text (not single chars), height should be greater than width
    if (!independentCharacters && height < width) {
      continue;
    }
    processComponent(textMap, labels, stats, i, imgW, imgH, detectedBoxes, true,
                     minimalAreaThreshold, dilationIter);
  }

  return detectedBoxes;
}

float calculateRestoreRatio(int32_t currentSize, int32_t desiredSize) {
  return desiredSize / static_cast<float>(currentSize);
}

void restoreBboxRatio(std::vector<types::DetectorBBox> &boxes,
                      float restoreRatio) {
  for (auto &box : boxes) {
    box.bbox = box.bbox.scale(restoreRatio, restoreRatio);
  }
}

float distanceFromPoint(const types::Point &p1, const types::Point &p2) {
  const float xDist = p2.x - p1.x;
  const float yDist = p2.y - p1.y;
  return std::hypot(xDist, yDist);
}

float normalizeAngle(float angle) {
  return (angle > 45.0f) ? (angle - 90.0f) : angle;
}

types::Point midpointBetweenPoint(const types::Point &p1,
                                  const types::Point &p2) {
  return {.x = std::midpoint(p1.x, p2.x), .y = std::midpoint(p1.y, p2.y)};
}

types::Point centerOfBox(const types::BBox &box) {
  return midpointBetweenPoint(box.p1, box.p2);
}

float minSideLength(const types::BBox &bbox) {
  return std::min(bbox.width(), bbox.height());
}

float maxSideLength(const types::BBox &bbox) {
  return std::max(bbox.width(), bbox.height());
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
std::tuple<float, float, bool> fitLineToShortestSides(const types::BBox &bbox) {
  const std::array<types::Point, 4> points = bboxToCorners(bbox);
  std::array<std::pair<float, float>, 4> sides;
  std::array<types::Point, 4> midpoints;
#pragma unroll
  for (std::size_t i = 0; i < midpoints.size(); i++) {
    const auto p1 = points[i];
    const auto p2 = points[(i + 1) % midpoints.size()];

    const float sideLength = distanceFromPoint(p1, p2);
    sides[i] = std::make_pair(sideLength, i);
    midpoints[i] = midpointBetweenPoint(p1, p2);
  }

  // Sort the sides by length ascending
  std::ranges::sort(sides);

  const types::Point midpoint1 = midpoints[sides[0].second];
  const types::Point midpoint2 = midpoints[sides[1].second];
  const float dx = std::fabs(midpoint2.x - midpoint1.x);

  float m, c;
  bool isVertical;

  std::array<cv::Point2f, 2> cvMidPoints = {
      cv::Point2f(midpoint1.x, midpoint1.y),
      cv::Point2f(midpoint2.x, midpoint2.y)};
  cv::Vec4f line;
  // parameteres for fitLine calculation:
  constexpr int32_t numericalParameter =
      0; // important only for some types of distances, O means an optimal value
         // is chosen
  constexpr double accuracy =
      0.01; // sufficient accuracy. Value proposed by OPENCV

  isVertical = dx < constants::kVerticalLineThreshold;
  if (isVertical) {
    for (auto &pt : cvMidPoints) {
      std::swap(pt.x, pt.y);
    }
  }
  cv::fitLine(cvMidPoints, line, cv::DIST_L2, numericalParameter, accuracy,
              accuracy);
  m = line[1] / line[0];
  c = line[3] - m * line[2];
  return {m, c, isVertical};
}

types::BBox rotateBox(const types::BBox &bbox, float angle) {
  const types::Point center = centerOfBox(bbox);
  const float radians = angle * M_PI / 180.0f;

  float minX = std::numeric_limits<float>::max();
  float minY = std::numeric_limits<float>::max();
  float maxX = std::numeric_limits<float>::lowest();
  float maxY = std::numeric_limits<float>::lowest();

  for (const auto &p : bboxToCorners(bbox)) {
    const float tx = p.x - center.x;
    const float ty = p.y - center.y;
    const float rx = tx * std::cos(radians) - ty * std::sin(radians) + center.x;
    const float ry = tx * std::sin(radians) + ty * std::cos(radians) + center.y;
    minX = std::min(minX, rx);
    minY = std::min(minY, ry);
    maxX = std::max(maxX, rx);
    maxY = std::max(maxY, ry);
  }

  return {{minX, minY}, {maxX, maxY}};
}

float calculateMinimalDistanceBetweenBox(const types::BBox &box1,
                                         const types::BBox &box2) {
  float minDistance = std::numeric_limits<float>::max();
  for (const auto &c1 : bboxToCorners(box1)) {
    for (const auto &c2 : bboxToCorners(box2)) {
      minDistance = std::min(minDistance, distanceFromPoint(c1, c2));
    }
  }
  return minDistance;
}

/**
 * Orders a set of 4 points in a clockwise direction starting with the top-left
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
types::BBox orderPointsClockwise(const types::BBox &bbox) {
  return {{std::min(bbox.p1.x, bbox.p2.x), std::min(bbox.p1.y, bbox.p2.y)},
          {std::max(bbox.p1.x, bbox.p2.x), std::max(bbox.p1.y, bbox.p2.y)}};
}

types::BBox mergeRotatedBoxes(const types::BBox &box1,
                              const types::BBox &box2) {
  return {{std::min(box1.p1.x, box2.p1.x), std::min(box1.p1.y, box2.p1.y)},
          {std::max(box1.p2.x, box2.p2.x), std::max(box1.p2.y, box2.p2.y)}};
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
findClosestBox(const std::vector<types::DetectorBBox> &boxes,
               const std::unordered_set<std::size_t> &ignoredIdxs,
               const types::BBox &currentBox, bool isVertical, float m, float c,
               float centerThreshold) {
  float smallestDistance = std::numeric_limits<float>::max();
  ssize_t idx = -1;
  float boxHeight = 0.0f;
  const types::Point centerOfCurrentBox = centerOfBox(currentBox);

  for (std::size_t i = 0; i < boxes.size(); i++) {
    if (ignoredIdxs.contains(i)) {
      continue;
    }
    const types::BBox &bbox = boxes[i].bbox;
    const types::Point centerOfProcessedBox = centerOfBox(bbox);
    const float distanceBetweenCenters =
        distanceFromPoint(centerOfCurrentBox, centerOfProcessedBox);

    if (distanceBetweenCenters >= smallestDistance) {
      continue;
    }

    boxHeight = minSideLength(bbox);

    const float lineDistance =
        isVertical ? std::fabs(centerOfProcessedBox.x -
                               (m * centerOfProcessedBox.y + c))
                   : std::fabs(centerOfProcessedBox.y -
                               (m * centerOfProcessedBox.x + c));

    if (lineDistance < boxHeight * centerThreshold) {
      idx = i;
      smallestDistance = distanceBetweenCenters;
    }
  }

  return idx != -1 ? std::optional(std::make_pair(idx, boxHeight))
                   : std::nullopt;
}

/**
 * Filters out boxes that are smaller than the specified thresholds.
 * A box is kept only if:
 *   - Its shorter side is **greater than** `minSideThreshold`, **and**
 *   - Its longer side is **greater than** `maxSideThreshold`.
 * Otherwise, the box is excluded from the result.
 */
std::vector<types::DetectorBBox>
removeSmallBoxesFromArray(const std::vector<types::DetectorBBox> &boxes,
                          float minSideThreshold, float maxSideThreshold) {
  std::vector<types::DetectorBBox> filteredBoxes;

  for (const auto &box : boxes) {
    const float maxSide = maxSideLength(box.bbox);
    const float minSide = minSideLength(box.bbox);
    if (minSide > minSideThreshold && maxSide > maxSideThreshold) {
      filteredBoxes.push_back(box);
    }
  }

  return filteredBoxes;
}

static float minimumYFromBox(const types::BBox &bbox) { return bbox.p1.y; }

std::vector<types::DetectorBBox>
groupTextBoxes(std::vector<types::DetectorBBox> &boxes, float centerThreshold,
               float distanceThreshold, float heightThreshold,
               int32_t minSideThreshold, int32_t maxSideThreshold,
               int32_t maxWidth) {
  // Sort boxes descending by maximum side length
  std::ranges::sort(boxes, [](const types::DetectorBBox &lhs,
                              const types::DetectorBBox &rhs) {
    return maxSideLength(lhs.bbox) > maxSideLength(rhs.bbox);
  });

  std::vector<types::DetectorBBox> mergedVec;
  float lineAngle;
  std::unordered_set<std::size_t> ignoredIdxs;
  while (!boxes.empty()) {
    auto currentBox = boxes[0];
    float normalizedAngle = normalizeAngle(currentBox.angle);
    boxes.erase(boxes.begin());
    ignoredIdxs.clear();

    while (true) {
      // Find all aligned boxes and merge them until max_size is reached or no
      // more boxes can be merged
      auto [slope, intercept, isVertical] =
          fitLineToShortestSides(currentBox.bbox);

      lineAngle = std::atan(slope) * 180.0f / M_PI;
      if (isVertical) {
        lineAngle = -90.0f;
      }
      auto closestBoxInfo =
          findClosestBox(boxes, ignoredIdxs, currentBox.bbox, isVertical, slope,
                         intercept, centerThreshold);
      if (!closestBoxInfo.has_value()) {
        break;
      }
      const auto [candidateIdx, candidateHeight] = closestBoxInfo.value();
      types::DetectorBBox candidateBox = boxes[candidateIdx];

      if ((numerical::isClose(candidateBox.angle, 90.0f) && !isVertical) ||
          (numerical::isClose(candidateBox.angle, 0.0f) && isVertical)) {
        candidateBox.bbox = rotateBox(candidateBox.bbox, normalizedAngle);
      }

      const float minDistance = calculateMinimalDistanceBetweenBox(
          candidateBox.bbox, currentBox.bbox);
      const float mergedHeight = minSideLength(currentBox.bbox);
      if (minDistance < distanceThreshold * candidateHeight &&
          std::fabs(mergedHeight - candidateHeight) <
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

  std::ranges::sort(mergedVec, [](const auto &obj1, const auto &obj2) {
    const auto &coords1 = obj1.bbox;
    const auto &coords2 = obj2.bbox;
    const float minY1 = minimumYFromBox(coords1);
    const float minY2 = minimumYFromBox(coords2);
    return minY1 < minY2;
  });

  std::vector<types::DetectorBBox> orderedSortedBoxes;
  orderedSortedBoxes.reserve(mergedVec.size());
  for (types::DetectorBBox bbox : mergedVec) {
    bbox.bbox = orderPointsClockwise(bbox.bbox);
    orderedSortedBoxes.push_back(std::move(bbox));
  }

  return orderedSortedBoxes;
}

void validateInputWidth(int32_t inputWidth, std::span<const int32_t> constants,
                        std::string modelName) {
  auto it = std::ranges::find(constants, inputWidth);

  if (it == constants.end()) {
    std::string allowed;
    for (size_t i = 0; i < constants.size(); ++i) {
      allowed +=
          std::to_string(constants[i]) + (i < constants.size() - 1 ? ", " : "");
    }

    throw std::runtime_error("Unexpected input width for " + modelName +
                             "! Expected [" + allowed + "] but got " +
                             std::to_string(inputWidth) + ".");
  }
}

} // namespace rnexecutorch::models::ocr::utils
