#import "DetectorUtils.h"

@implementation DetectorUtils

+ (void)interleavedArrayToMats:(NSArray *)array
                    outputMat1:(cv::Mat &)mat1
                    outputMat2:(cv::Mat &)mat2
                      withSize:(cv::Size)size {
  mat1 = cv::Mat(size.height, size.width, CV_32F);
  mat2 = cv::Mat(size.height, size.width, CV_32F);

  for (NSUInteger idx = 0; idx < array.count; idx++) {
    const CGFloat value = [array[idx] doubleValue];
    const int x = (idx / 2) % size.width;
    const int y = (idx / 2) / size.width;

    if (idx % 2 == 0) {
      mat1.at<float>(y, x) = value;
    } else {
      mat2.at<float>(y, x) = value;
    }
  }
}

/**
 * This method applies a series of image processing operations to identify
 * likely areas of text in the textMap and return the bounding boxes for single
 * words.
 *
 * @param textMap A cv::Mat representing a heat map of the characters of text
 * being present in an image.
 * @param affinityMap A cv::Mat representing a heat map of the affinity between
 * characters.
 * @param textThreshold A CGFloat representing the threshold for the text map.
 * @param linkThreshold A CGFloat representing the threshold for the affinity
 * map.
 * @param lowTextThreshold A CGFloat representing the low text.
 *
 * @return An NSArray containing NSDictionary objects. Each dictionary includes:
 *  - "bbox": an NSArray of CGPoint values representing the vertices of the
 * detected text box.
 *  - "angle": an NSNumber representing the rotation angle of the box.
 */
+ (NSArray *)getDetBoxesFromTextMap:(cv::Mat)textMap
                        affinityMap:(cv::Mat)affinityMap
                 usingTextThreshold:(CGFloat)textThreshold
                      linkThreshold:(CGFloat)linkThreshold
                   lowTextThreshold:(CGFloat)lowTextThreshold {
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

  NSMutableArray *detectedBoxes = [NSMutableArray array];
  for (int i = 1; i < nLabels; i++) {
    const int area = stats.at<int>(i, cv::CC_STAT_AREA);
    if (area < 10)
      continue;

    cv::Mat mask = (labels == i);
    CGFloat maxVal;
    cv::minMaxLoc(textMap, NULL, &maxVal, NULL, NULL, mask);
    if (maxVal < lowTextThreshold)
      continue;

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
      NSMutableArray *pointsArray = [NSMutableArray arrayWithCapacity:4];
      for (int j = 0; j < 4; j++) {
        const CGPoint point = CGPointMake(vertices[j].x, vertices[j].y);
        [pointsArray addObject:[NSValue valueWithCGPoint:point]];
      }
      NSDictionary *dict =
          @{@"bbox" : pointsArray, @"angle" : @(minRect.angle)};
      [detectedBoxes addObject:dict];
    }
  }

  return detectedBoxes;
}

+ (NSArray<NSDictionary *> *)restoreBboxRatio:(NSArray<NSDictionary *> *)boxes
                            usingRestoreRatio:(CGFloat)restoreRatio {
  NSMutableArray *result = [NSMutableArray array];
  for (NSUInteger i = 0; i < [boxes count]; i++) {
    NSDictionary *box = boxes[i];
    NSMutableArray *boxArray = [NSMutableArray arrayWithCapacity:4];
    for (NSValue *value in box[@"bbox"]) {
      CGPoint point = [value CGPointValue];
      point.x *= restoreRatio;
      point.y *= restoreRatio;
      [boxArray addObject:[NSValue valueWithCGPoint:point]];
    }
    NSDictionary *dict = @{@"bbox" : boxArray, @"angle" : box[@"angle"]};
    [result addObject:dict];
  }

  return result;
}

/**
 * This method normalizes angle returned from cv::minAreaRect function which
 *ranges from 0 to 90 degrees.
 **/
+ (CGFloat)normalizeAngle:(CGFloat)angle {
  if (angle > 45) {
    return angle - 90;
  }
  return angle;
}

+ (CGPoint)midpointBetweenPoint:(CGPoint)p1 andPoint:(CGPoint)p2 {
  return CGPointMake((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
}

+ (CGFloat)distanceFromPoint:(CGPoint)p1 toPoint:(CGPoint)p2 {
  const CGFloat xDist = (p2.x - p1.x);
  const CGFloat yDist = (p2.y - p1.y);
  return sqrt(xDist * xDist + yDist * yDist);
}

+ (CGPoint)centerOfBox:(NSArray<NSValue *> *)box {
  return [self midpointBetweenPoint:[box[0] CGPointValue]
                           andPoint:[box[2] CGPointValue]];
}

+ (CGFloat)maxSideLength:(NSArray<NSValue *> *)points {
  CGFloat maxSideLength = 0;
  NSInteger numOfPoints = points.count;
  for (NSInteger i = 0; i < numOfPoints; i++) {
    const CGPoint currentPoint = [points[i] CGPointValue];
    const CGPoint nextPoint = [points[(i + 1) % numOfPoints] CGPointValue];

    const CGFloat sideLength = [self distanceFromPoint:currentPoint
                                               toPoint:nextPoint];
    if (sideLength > maxSideLength) {
      maxSideLength = sideLength;
    }
  }
  return maxSideLength;
}

+ (CGFloat)minSideLength:(NSArray<NSValue *> *)points {
  CGFloat minSideLength = CGFLOAT_MAX;
  NSInteger numOfPoints = points.count;

  for (NSInteger i = 0; i < numOfPoints; i++) {
    const CGPoint currentPoint = [points[i] CGPointValue];
    const CGPoint nextPoint = [points[(i + 1) % numOfPoints] CGPointValue];

    const CGFloat sideLength = [self distanceFromPoint:currentPoint
                                               toPoint:nextPoint];
    if (sideLength < minSideLength) {
      minSideLength = sideLength;
    }
  }

  return minSideLength;
}

+ (CGFloat)calculateMinimalDistanceBetweenBox:(NSArray<NSValue *> *)box1
                                       andBox:(NSArray<NSValue *> *)box2 {
  CGFloat minDistance = CGFLOAT_MAX;
  for (NSValue *value1 in box1) {
    const CGPoint corner1 = [value1 CGPointValue];
    for (NSValue *value2 in box2) {
      const CGPoint corner2 = [value2 CGPointValue];
      const CGFloat distance = [self distanceFromPoint:corner1 toPoint:corner2];
      if (distance < minDistance) {
        minDistance = distance;
      }
    }
  }
  return minDistance;
}

+ (NSArray<NSValue *> *)rotateBox:(NSArray<NSValue *> *)box
                        withAngle:(CGFloat)angle {
  const CGPoint center = [self centerOfBox:box];

  const CGFloat radians = angle * M_PI / 180.0;

  NSMutableArray<NSValue *> *rotatedPoints =
      [NSMutableArray arrayWithCapacity:4];
  for (NSValue *value in box) {
    const CGPoint point = [value CGPointValue];

    const CGFloat translatedX = point.x - center.x;
    const CGFloat translatedY = point.y - center.y;

    const CGFloat rotatedX =
        translatedX * cos(radians) - translatedY * sin(radians);
    const CGFloat rotatedY =
        translatedX * sin(radians) + translatedY * cos(radians);

    const CGPoint rotatedPoint =
        CGPointMake(rotatedX + center.x, rotatedY + center.y);
    [rotatedPoints addObject:[NSValue valueWithCGPoint:rotatedPoint]];
  }

  return rotatedPoints;
}

/**
 * Orders a set of points in a clockwise direction starting with the top-left
 * point.
 *
 * Process:
 * 1. It iterates through each CGPoint extracted from the NSValues.
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
+ (NSArray *)orderPointsClockwise:(NSArray<NSValue *> *)points {
  CGPoint topLeft, topRight, bottomRight, bottomLeft;
  CGFloat minSum = FLT_MAX;
  CGFloat maxSum = -FLT_MAX;
  CGFloat minDiff = FLT_MAX;
  CGFloat maxDiff = -FLT_MAX;

  for (NSValue *value in points) {
    const CGPoint pt = [value CGPointValue];
    const CGFloat sum = pt.x + pt.y;
    const CGFloat diff = pt.y - pt.x;

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

  NSArray<NSValue *> *rect = @[
    [NSValue valueWithCGPoint:topLeft], [NSValue valueWithCGPoint:topRight],
    [NSValue valueWithCGPoint:bottomRight],
    [NSValue valueWithCGPoint:bottomLeft]
  ];

  return rect;
}

+ (std::vector<cv::Point2f>)pointsFromNSValues:(NSArray<NSValue *> *)nsValues {
  std::vector<cv::Point2f> points;
  for (NSValue *value in nsValues) {
    const CGPoint point = [value CGPointValue];
    points.emplace_back(point.x, point.y);
  }
  return points;
}

+ (NSArray<NSValue *> *)nsValuesFromPoints:(cv::Point2f *)points
                                     count:(int)count {
  NSMutableArray<NSValue *> *nsValues =
      [[NSMutableArray alloc] initWithCapacity:count];
  for (int i = 0; i < count; i++) {
    [nsValues addObject:[NSValue valueWithCGPoint:CGPointMake(points[i].x,
                                                              points[i].y)]];
  }
  return nsValues;
}

+ (NSArray<NSValue *> *)mergeRotatedBoxes:(NSArray<NSValue *> *)box1
                                  withBox:(NSArray<NSValue *> *)box2 {
  box1 = [self orderPointsClockwise:box1];
  box2 = [self orderPointsClockwise:box2];

  std::vector<cv::Point2f> points1 = [self pointsFromNSValues:box1];
  std::vector<cv::Point2f> points2 = [self pointsFromNSValues:box2];

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

  return [self nsValuesFromPoints:rectPoints count:4];
}

+ (NSMutableArray<NSDictionary *> *)
    removeSmallBoxesFromArray:(NSArray *)boxes
        usingMinSideThreshold:(CGFloat)minSideThreshold
             maxSideThreshold:(CGFloat)maxSideThreshold {
  NSMutableArray *filteredBoxes = [NSMutableArray array];

  for (NSDictionary *box in boxes) {
    const CGFloat maxSideLength = [self maxSideLength:box[@"bbox"]];
    const CGFloat minSideLength = [self minSideLength:box[@"bbox"]];
    if (minSideLength > minSideThreshold && maxSideLength > maxSideThreshold) {
      [filteredBoxes addObject:box];
    }
  }

  return filteredBoxes;
}

+ (CGFloat)minimumYFromBox:(NSArray<NSValue *> *)box {
  __block CGFloat minY = CGFLOAT_MAX;
  [box enumerateObjectsUsingBlock:^(NSValue *_Nonnull obj, NSUInteger idx,
                                    BOOL *_Nonnull stop) {
    const CGPoint pt = [obj CGPointValue];
    if (pt.y < minY) {
      minY = pt.y;
    }
  }];
  return minY;
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
 * @return A NSDictionary containing:
 *   - "slope": NSNumber representing the slope (m) of the line.
 *   - "intercept": NSNumber representing the line's intercept (c) with y-axis.
 *   - "isVertical": NSNumber (boolean) indicating whether the line is
 * considered vertical.
 */
+ (NSDictionary *)fitLineToShortestSides:(NSArray<NSValue *> *)points {
  NSMutableArray<NSDictionary *> *sides = [NSMutableArray array];
  NSMutableArray<NSValue *> *midpoints = [NSMutableArray array];

  for (int i = 0; i < 4; i++) {
    const CGPoint p1 = [points[i] CGPointValue];
    const CGPoint p2 = [points[(i + 1) % 4] CGPointValue];

    const CGFloat sideLength = [self distanceFromPoint:p1 toPoint:p2];
    [sides addObject:@{@"length" : @(sideLength), @"index" : @(i)}];
    [midpoints
        addObject:[NSValue valueWithCGPoint:[self midpointBetweenPoint:p1
                                                              andPoint:p2]]];
  }

  [sides
      sortUsingDescriptors:@[ [NSSortDescriptor sortDescriptorWithKey:@"length"
                                                            ascending:YES] ]];

  const CGPoint midpoint1 =
      [midpoints [[sides [0] [@"index"] intValue]] CGPointValue];
  const CGPoint midpoint2 =
      [midpoints [[sides [1] [@"index"] intValue]] CGPointValue];
  const CGFloat dx = fabs(midpoint2.x - midpoint1.x);

  CGFloat m, c;
  BOOL isVertical;

  std::vector<cv::Point2f> cvMidPoints = {
      cv::Point2f(midpoint1.x, midpoint1.y),
      cv::Point2f(midpoint2.x, midpoint2.y)};
  cv::Vec4f line;

  if (dx < verticalLineThreshold) {
    for (auto &pt : cvMidPoints)
      std::swap(pt.x, pt.y);
    cv::fitLine(cvMidPoints, line, cv::DIST_L2, 0, 0.01, 0.01);
    m = line[1] / line[0];
    c = line[3] - m * line[2];
    isVertical = YES;
  } else {
    cv::fitLine(cvMidPoints, line, cv::DIST_L2, 0, 0.01, 0.01);
    m = line[1] / line[0];
    c = line[3] - m * line[2];
    isVertical = NO;
  }

  return @{@"slope" : @(m), @"intercept" : @(c), @"isVertical" : @(isVertical)};
}

/**
 * This method assesses each box from a provided array, checks its center
 * against the center of a "current box", and evaluates its alignment with a
 * specified line equation. The function specifically searches for the box whose
 * center is closest to the current box, that has not been ignored, and fits
 * within a defined distance from the line.
 *
 * @param boxes An NSArray of NSDictionary objects where each dictionary
 * represents a box with keys "bbox" and "angle". "bbox" is an NSArray of
 * NSValue objects each encapsulating CGPoint that define the box vertices.
 *              "angle" is a NSNumber representing the box's rotation angle.
 * @param ignoredIdxs An NSSet of NSNumber objects representing indices of boxes
 * to ignore in the evaluation.
 * @param currentBox An NSArray of NSValue objects encapsulating CGPoints
 * representing the current box to compare against.
 * @param isVertical A pointer to a BOOL indicating if the line to compare
 * distance to is vertical.
 * @param m The slope (gradient) of the line against which the box's alignment
 * is checked.
 * @param c The y-intercept of the line equation y = mx + c.
 * @param centerThreshold A multiplier to determine the threshold for the
 * distance between the box's center and the line.
 *
 * @return A NSDictionary containing:
 *         - "idx" : NSNumber indicating the index of the found box in the
 * original NSArray.
 *         - "boxHeight" : NSNumber representing the shortest side length of the
 * found box. Returns nil if no suitable box is found.
 */
+ (NSDictionary *)findClosestBox:(NSArray<NSDictionary *> *)boxes
                     ignoredIdxs:(NSSet<NSNumber *> *)ignoredIdxs
                      currentBox:(NSArray<NSValue *> *)currentBox
                      isVertical:(BOOL)isVertical
                               m:(CGFloat)m
                               c:(CGFloat)c
                 centerThreshold:(CGFloat)centerThreshold {
  CGFloat smallestDistance = CGFLOAT_MAX;
  NSInteger idx = -1;
  CGFloat boxHeight = 0;
  const CGPoint centerOfCurrentBox = [self centerOfBox:currentBox];

  for (NSUInteger i = 0; i < boxes.count; i++) {
    if ([ignoredIdxs containsObject:@(i)]) {
      continue;
    }
    NSArray<NSValue *> *bbox = boxes[i][@"bbox"];
    const CGPoint centerOfProcessedBox = [self centerOfBox:bbox];
    const CGFloat distanceBetweenCenters =
        [self distanceFromPoint:centerOfCurrentBox
                        toPoint:centerOfProcessedBox];

    if (distanceBetweenCenters >= smallestDistance) {
      continue;
    }

    boxHeight = [self minSideLength:bbox];

    const CGFloat lineDistance =
        (isVertical
             ? fabs(centerOfProcessedBox.x - (m * centerOfProcessedBox.y + c))
             : fabs(centerOfProcessedBox.y - (m * centerOfProcessedBox.x + c)));

    if (lineDistance < boxHeight * centerThreshold) {
      idx = i;
      smallestDistance = distanceBetweenCenters;
    }
  }

  return idx != -1 ? @{@"idx" : @(idx), @"boxHeight" : @(boxHeight)} : nil;
}

/**
 * This method processes an array of text box dictionaries, each containing
 * details about individual text boxes, and attempts to group and merge these
 * boxes based on specified criteria including proximity, alignment, and size
 * thresholds. It prioritizes merging of boxes that are aligned closely in
 * angle, are near each other, and whose sizes are compatible based on the given
 * thresholds.
 *
 * @param boxes An array of NSDictionary objects where each dictionary
 * represents a text box. Each dictionary must have at least a "bbox" key with
 * an NSArray of NSValue wrapping CGPoints defining the box vertices, and an
 * "angle" key indicating the orientation of the box.
 * @param centerThreshold A CGFloat representing the threshold for considering
 * the distance between center and fitted line.
 * @param distanceThreshold A CGFloat that defines the maximum allowed distance
 * between boxes for them to be considered for merging.
 * @param heightThreshold A CGFloat representing the maximum allowed difference
 * in height between boxes for merging.
 * @param minSideThreshold An int that defines the minimum dimension threshold
 * to filter out small boxes after grouping.
 * @param maxSideThreshold An int that specifies the maximum dimension threshold
 * for filtering boxes post-grouping.
 * @param maxWidth An int that represents the maximum width allowable for a
 * merged box.
 *
 * @return An NSArray of NSDictionary objects representing the merged boxes.
 * Each dictionary contains:
 *         - "bbox": An NSArray of NSValue each containing a CGPoint that
 * defines the vertices of the merged box.
 *         - "angle": NSNumber representing the computed orientation of the
 * merged box.
 *
 * Processing Steps:
 * 1. Sort initial boxes based on their maximum side length.
 * 2. Sequentially merge boxes considering alignment, proximity, and size
 * compatibility.
 * 3. Post-processing to remove any boxes that are too small or exceed max side
 * criteria.
 * 4. Sort the final array of boxes by their vertical positions.
 */
+ (NSArray<NSDictionary *> *)groupTextBoxes:
                                 (NSMutableArray<NSDictionary *> *)boxes
                            centerThreshold:(CGFloat)centerThreshold
                          distanceThreshold:(CGFloat)distanceThreshold
                            heightThreshold:(CGFloat)heightThreshold
                           minSideThreshold:(int)minSideThreshold
                           maxSideThreshold:(int)maxSideThreshold
                                   maxWidth:(int)maxWidth {
  // Sort boxes based on their maximum side length
  boxes = [boxes sortedArrayUsingComparator:^NSComparisonResult(
                     NSDictionary *obj1, NSDictionary *obj2) {
            const CGFloat maxLen1 = [self maxSideLength:obj1[@"bbox"]];
            const CGFloat maxLen2 = [self maxSideLength:obj2[@"bbox"]];
            return (maxLen1 < maxLen2)   ? NSOrderedDescending
                   : (maxLen1 > maxLen2) ? NSOrderedAscending
                                         : NSOrderedSame;
          }].mutableCopy;

  NSMutableArray<NSDictionary *> *mergedArray = [NSMutableArray array];
  CGFloat lineAngle;
  while (boxes.count > 0) {
    NSMutableDictionary *currentBox = [boxes[0] mutableCopy];
    CGFloat normalizedAngle =
        [self normalizeAngle:[currentBox[@"angle"] floatValue]];
    [boxes removeObjectAtIndex:0];
    NSMutableArray<NSNumber *> *ignoredIdxs = [NSMutableArray array];

    while (YES) {
      // Find all aligned boxes and merge them until max_size is reached or no
      // more boxes can be merged
      NSDictionary *fittedLine =
          [self fitLineToShortestSides:currentBox[@"bbox"]];
      const CGFloat slope = [fittedLine[@"slope"] floatValue];
      const CGFloat intercept = [fittedLine[@"intercept"] floatValue];
      const BOOL isVertical = [fittedLine[@"isVertical"] boolValue];

      lineAngle = atan(slope) * 180 / M_PI;
      if (isVertical) {
        lineAngle = -90;
      }

      NSDictionary *closestBoxInfo =
          [self findClosestBox:boxes
                   ignoredIdxs:[NSSet setWithArray:ignoredIdxs]
                    currentBox:currentBox[@"bbox"]
                    isVertical:isVertical
                             m:slope
                             c:intercept
               centerThreshold:centerThreshold];
      if (closestBoxInfo == nil)
        break;

      NSInteger candidateIdx = [closestBoxInfo[@"idx"] integerValue];
      NSMutableDictionary *candidateBox = [boxes[candidateIdx] mutableCopy];
      const CGFloat candidateHeight = [closestBoxInfo[@"boxHeight"] floatValue];

      if (([candidateBox[@"angle"] isEqual:@90] && !isVertical) ||
          ([candidateBox[@"angle"] isEqual:@0] && isVertical)) {
        candidateBox[@"bbox"] = [self rotateBox:candidateBox[@"bbox"]
                                      withAngle:normalizedAngle];
      }

      const CGFloat minDistance =
          [self calculateMinimalDistanceBetweenBox:candidateBox[@"bbox"]
                                            andBox:currentBox[@"bbox"]];
      const CGFloat mergedHeight = [self minSideLength:currentBox[@"bbox"]];
      if (minDistance < distanceThreshold * candidateHeight &&
          fabs(mergedHeight - candidateHeight) <
              candidateHeight * heightThreshold) {
        currentBox[@"bbox"] = [self mergeRotatedBoxes:currentBox[@"bbox"]
                                              withBox:candidateBox[@"bbox"]];
        [boxes removeObjectAtIndex:candidateIdx];
        [ignoredIdxs removeAllObjects];
        if ([self maxSideLength:currentBox[@"bbox"]] > maxWidth) {
          break;
        }
      } else {
        [ignoredIdxs addObject:@(candidateIdx)];
      }
    }

    [mergedArray
        addObject:@{@"bbox" : currentBox[@"bbox"], @"angle" : @(lineAngle)}];
  }

  // Remove small boxes and sort by vertical
  mergedArray = [self removeSmallBoxesFromArray:mergedArray
                          usingMinSideThreshold:minSideThreshold
                               maxSideThreshold:maxSideThreshold];

  NSArray<NSDictionary *> *sortedBoxes = [mergedArray
      sortedArrayUsingComparator:^NSComparisonResult(NSDictionary *obj1,
                                                     NSDictionary *obj2) {
        NSArray<NSValue *> *coords1 = obj1[@"bbox"];
        NSArray<NSValue *> *coords2 = obj2[@"bbox"];
        const CGFloat minY1 = [self minimumYFromBox:coords1];
        const CGFloat minY2 = [self minimumYFromBox:coords2];
        return (minY1 < minY2)   ? NSOrderedAscending
               : (minY1 > minY2) ? NSOrderedDescending
                                 : NSOrderedSame;
      }];

  return sortedBoxes;
}

@end
