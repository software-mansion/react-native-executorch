#import "DetectorUtils.h"

@implementation DetectorUtils

+ (CGFloat)normalizeAngle:(CGFloat)angle {
  /*
   Normalize the angle returned by OpenCV's minAreaRect.
   */
  if (angle > 45) {
    return angle - 90;
  }
  return angle;
}

+ (CGFloat)distance:(CGPoint)p1 p2:(CGPoint)p2 {
  double xDist = (p2.x - p1.x);
  double yDist = (p2.y - p1.y);
  return sqrt(xDist * xDist + yDist * yDist);
}

+ (CGPoint)midpoint:(CGPoint)p1 p2:(CGPoint)p2 {
  return CGPointMake((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
}

+ (CGPoint)centerOfBox:(NSArray *)box {
  return CGPointMake(([box[0] CGPointValue].x + [box[2] CGPointValue].x) / 2, ([box[0] CGPointValue].y + [box[2] CGPointValue].y) / 2);
}

+ (CGFloat)maxSideLength:(NSArray<NSValue *> *)points {
  CGFloat maxSideLength = 0;
  NSInteger numOfPoints = points.count;
  for (NSInteger i = 0; i < numOfPoints; i++) {
    CGPoint currentPoint = [points[i] CGPointValue];
    CGPoint nextPoint = [points[(i + 1) % numOfPoints] CGPointValue];
    
    CGFloat sideLength = [self distance:currentPoint p2:nextPoint];
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
    CGPoint currentPoint = [points[i] CGPointValue];
    CGPoint nextPoint = [points[(i + 1) % numOfPoints] CGPointValue];
    
    CGFloat sideLength = [self distance:currentPoint p2:nextPoint];
    if (sideLength < minSideLength) {
      minSideLength = sideLength;
    }
  }
  
  return minSideLength;
}

+ (NSArray *)orderPointsClockwise:(NSArray<NSValue *> *)points{
  CGPoint topLeft, topRight, bottomRight, bottomLeft;
  float minSum = FLT_MAX;
  float maxSum = -FLT_MAX;
  float minDiff = FLT_MAX;
  float maxDiff = -FLT_MAX;
  
  for (NSValue *value in points) {
    CGPoint pt = [value CGPointValue];
    float sum = pt.x + pt.y;
    float diff = pt.y - pt.x;
    
    // For top-left and bottom-right determination
    if (sum < minSum) {
      minSum = sum;
      topLeft = pt;
    }
    if (sum > maxSum) {
      maxSum = sum;
      bottomRight = pt;
    }
    
    // For top-right and bottom-left determination
    if (diff < minDiff) {
      minDiff = diff;
      topRight = pt;
    }
    if (diff > maxDiff) {
      maxDiff = diff;
      bottomLeft = pt;
    }
  }
  
  NSArray<NSValue *> *rect = @[[NSValue valueWithCGPoint:topLeft],
                               [NSValue valueWithCGPoint:topRight],
                               [NSValue valueWithCGPoint:bottomRight],
                               [NSValue valueWithCGPoint:bottomLeft]];
  
  return rect;
}

+ (NSArray<NSValue *> *)rotateBox:(NSArray<NSValue *> *)box withAngle:(CGFloat)angle {
  // Calculate the center of the rectangle
  CGPoint center = [self centerOfBox:box];
  
  // Convert angle from degrees to radians
  CGFloat radians = angle * M_PI / 180.0;
  
  // Prepare an array to hold the rotated points
  NSMutableArray<NSValue *> *rotatedPoints = [NSMutableArray arrayWithCapacity:4];
  for (NSValue *value in box) {
    CGPoint point = [value CGPointValue];
    
    // Translate point to origin
    CGFloat translatedX = point.x - center.x;
    CGFloat translatedY = point.y - center.y;
    
    // Rotate point
    CGFloat rotatedX = translatedX * cos(radians) - translatedY * sin(radians);
    CGFloat rotatedY = translatedX * sin(radians) + translatedY * cos(radians);
    
    // Translate point back
    CGPoint rotatedPoint = CGPointMake(rotatedX + center.x, rotatedY + center.y);
    [rotatedPoints addObject:[NSValue valueWithCGPoint:rotatedPoint]];
  }

  return rotatedPoints;
}

+ (std::vector<cv::Point2f>)pointsFromNSValues:(NSArray<NSValue *> *)nsValues {
  std::vector<cv::Point2f> points;
  for (NSValue *value in nsValues) {
    CGPoint point = [value CGPointValue];
    points.emplace_back(point.x, point.y);
  }
  return points;
}

+ (NSArray<NSValue *> *)nsValuesFromPoints:(cv::Point2f *)points count:(int)count {
  NSMutableArray<NSValue *> *nsValues = [[NSMutableArray alloc] initWithCapacity:count];
  for (int i = 0; i < count; i++) {
    [nsValues addObject:[NSValue valueWithCGPoint:CGPointMake(points[i].x, points[i].y)]];
  }
  return nsValues;
}

+ (NSArray<NSValue *> *)mergeRotatedBoxes:(NSArray<NSValue *> *)box1 withBox:(NSArray<NSValue *> *)box2 {
  box1 = [self orderPointsClockwise:box1];
  box2 = [self orderPointsClockwise:box2];
  
  std::vector<cv::Point2f> points1 = [self pointsFromNSValues:box1];
  std::vector<cv::Point2f> points2 = [self pointsFromNSValues:box2];
  
  // Collect all points from both rectangles
  std::vector<cv::Point2f> allPoints;
  allPoints.insert(allPoints.end(), points1.begin(), points1.end());
  allPoints.insert(allPoints.end(), points2.begin(), points2.end());
  
  // Calculate the convex hull of all points
  std::vector<int> hullIndices;
  cv::convexHull(allPoints, hullIndices, false);
  
  std::vector<cv::Point2f> hullPoints;
  for (int idx : hullIndices) {
    hullPoints.push_back(allPoints[idx]);
  }
  
  // Get the minimum area rectangle that bounds the convex hull
  cv::RotatedRect minAreaRect = cv::minAreaRect(hullPoints);
  
  cv::Point2f rectPoints[4];
  minAreaRect.points(rectPoints);
  
  // Convert rotated rectangle points back to NSArray
  return [self nsValuesFromPoints:rectPoints count:4];
}

+ (NSDictionary *)splitInterleavedNSArray:(NSArray *)array {
  NSMutableArray *scoreText = [[NSMutableArray alloc] init];
  NSMutableArray *scoreLink = [[NSMutableArray alloc] init];
  
  [array enumerateObjectsUsingBlock:^(id element, NSUInteger idx, BOOL *stop) {
    if (idx % 2 == 0) {
      [scoreText addObject:element];
    } else {
      [scoreLink addObject:element];
    }
  }];
  
  return @{@"ScoreText": scoreText, @"ScoreLink": scoreLink};
}

+ (CGFloat)calculateMinimalDistance:(NSArray<NSValue *> *)corners1 corners2:(NSArray<NSValue *> *)corners2 {
  CGFloat minDistance = CGFLOAT_MAX;
  for (NSValue *value1 in corners1) {
    CGPoint corner1 = [value1 CGPointValue];
    for (NSValue *value2 in corners2) {
      CGPoint corner2 = [value2 CGPointValue];
      CGFloat distance = [self distance:corner1 p2:corner2];
      if (distance < minDistance) {
        minDistance = distance;
      }
    }
  }
  return minDistance;
}

+ (NSDictionary *)fitLineToShortestSides:(NSArray<NSValue *> *)points {
  // Calculate distances and find midpoints
  NSMutableArray<NSDictionary *> *sides = [NSMutableArray array];
  NSMutableArray<NSValue *> *midpoints = [NSMutableArray array];
  
  for (int i = 0; i < 4; i++) {
      CGPoint p1 = [points[i] CGPointValue];
      CGPoint p2 = [points[(i + 1) % 4] CGPointValue];
      
      CGFloat sideLength = [self distance:p1 p2:p2];
      [sides addObject:@{@"length": @(sideLength), @"index": @(i)}];
      [midpoints addObject:[NSValue valueWithCGPoint:[self midpoint:p1 p2:p2]]];
  }
  
  // Sort indices by distances
  [sides sortUsingDescriptors:@[[NSSortDescriptor sortDescriptorWithKey:@"length" ascending:YES]]];
  
  CGPoint midpoint1 = [midpoints[[sides[0][@"index"] intValue]] CGPointValue];
  CGPoint midpoint2 = [midpoints[[sides[1][@"index"] intValue]] CGPointValue];
  CGFloat dx = fabs(midpoint2.x - midpoint1.x);
  
  float m, c;
  BOOL isVertical;
  
  std::vector<cv::Point2f> cvMidPoints = {cv::Point2f(midpoint1.x, midpoint1.y), cv::Point2f(midpoint2.x, midpoint2.y)};
  cv::Vec4f line;
  
  if (dx < 20) {
    // If almost vertical, fit x = my + c
    for (auto &pt : cvMidPoints) std::swap(pt.x, pt.y);
    cv::fitLine(cvMidPoints, line, cv::DIST_L2, 0, 0.01, 0.01);
    m = line[1] / line[0];
    c = line[3] - m * line[2];
    isVertical = YES;
  } else {
    // Fit y = mx + c
    cv::fitLine(cvMidPoints, line, cv::DIST_L2, 0, 0.01, 0.01);
    m = line[1] / line[0];
    c = line[3] - m * line[2];
    isVertical = NO;
  }

  return @{@"slope": @(m), @"intercept": @(c), @"isVertical": @(isVertical)};
}

+ (NSDictionary *)findClosestBox:(NSArray<NSDictionary *> *)polys
                     ignoredIdxs:(NSSet<NSNumber *> *)ignoredIdxs
                      currentBox:(NSArray<NSValue *> *)currentBox
                      isVertical:(BOOL)isVertical
                               m:(CGFloat)m
                               c:(CGFloat)c
                 centerThreshold:(CGFloat)centerThreshold
{
  CGFloat smallestDistance = CGFLOAT_MAX;
  NSDictionary *boxToMerge = nil;
  NSInteger idx = -1;
  CGFloat boxHeight = 0;
  CGPoint centerOfCurrentBox = [self centerOfBox:currentBox];
  
  for (NSUInteger i = 0; i < polys.count; i++) {
    if ([ignoredIdxs containsObject:@(i)]) {
      continue;
    }
    NSArray<NSValue *> *coords = polys[i][@"box"];
    CGFloat angle = [polys[i][@"angle"] doubleValue];
    CGPoint centerOfProcessedBox = [self centerOfBox:coords];
    CGFloat distanceBetweenCenters = [self distance:centerOfCurrentBox p2:centerOfProcessedBox];
    
    if (distanceBetweenCenters >= smallestDistance) {
      continue;
    }
    
    boxHeight = [self minSideLength:coords];
    
    CGFloat lineDistance = (isVertical ?
                            fabs(centerOfProcessedBox.x - (m * centerOfProcessedBox.y + c)) :
                            fabs(centerOfProcessedBox.y - (m * centerOfProcessedBox.x + c)));
    
    if (lineDistance < boxHeight * centerThreshold) {
      boxToMerge = @{@"coords": coords, @"angle": @(angle)};
      idx = i;
      smallestDistance = distanceBetweenCenters;
    }
  }
  
  return boxToMerge ? @{@"boxToMerge": boxToMerge, @"idx": @(idx), @"boxHeight": @(boxHeight)} : nil;
}

+ (NSArray *)restoreBboxRatio:(NSArray *)boxes {
  NSMutableArray *result = [NSMutableArray array];
  for (NSUInteger i = 0; i < [boxes count]; i++) {
    NSDictionary *box = boxes[i];
    NSMutableArray *boxArray = [NSMutableArray arrayWithCapacity:4];
    for (NSValue *value in box[@"box"]) {
      CGPoint point = [value CGPointValue];
      point.x *= 2 * 1.6;
      point.y *= 2 * 1.6;
      [boxArray addObject:[NSValue valueWithCGPoint:point]];
    }
    NSDictionary *dict = @{@"box": boxArray, @"angle": box[@"angle"]};
    [result addObject:dict];
  }
  
  return result;
}

+ (NSArray *)getDetBoxes:(cv::Mat)textmap linkMap:(cv::Mat)linkmap textThreshold:(double)textThreshold linkThreshold:(double)linkThreshold lowText:(double)lowText {
  int img_h = textmap.rows;
  int img_w = textmap.cols;
  cv::Mat textScore, linkScore;
  cv::threshold(textmap, textScore, lowText, 1, 0);
  cv::threshold(linkmap, linkScore, linkThreshold, 1, 0);
  cv::Mat textScoreComb = textScore + linkScore;
  cv::threshold(textScoreComb, textScoreComb, 0, 1, cv::THRESH_BINARY);
  cv::Mat binaryMat;
  textScoreComb.convertTo(binaryMat, CV_8UC1);
  
  cv::Mat labels, stats, centroids;
  int nLabels = cv::connectedComponentsWithStats(binaryMat, labels, stats, centroids, 4);
  
  NSMutableArray *detectedBoxes = [NSMutableArray array];
  for (int i = 1; i < nLabels; i++) {
    int area = stats.at<int>(i, cv::CC_STAT_AREA);
    if (area < 10) continue;
    
    cv::Mat mask = (labels == i);
    double maxVal;
    cv::minMaxLoc(textmap, NULL, &maxVal, NULL, NULL, mask);
    if (maxVal < textThreshold) continue;
    
    cv::Mat segMap = cv::Mat::zeros(textmap.size(), CV_8U);
    segMap.setTo(255, (labels == i));
    
    int x = stats.at<int>(i, cv::CC_STAT_LEFT);
    int y = stats.at<int>(i, cv::CC_STAT_TOP);
    int w = stats.at<int>(i, cv::CC_STAT_WIDTH);
    int h = stats.at<int>(i, cv::CC_STAT_HEIGHT);
    int niter = (int)(sqrt((double)(area * MIN(w, h)) / (double)(w * h)) * 2.0);
    int sx = x - niter;
    int ex = x + w + niter + 1;
    int sy = y - niter;
    int ey = y + h + niter + 1;
    if (sx < 0) sx = 0;
    if (sy < 0) sy = 0;
    if (ex >= img_w) ex = img_w;
    if (ey >= img_h) ey = img_h;
    cv::Rect roi(sx, sy, ex - sx, ey - sy);
    
    cv::Mat kernel = cv::getStructuringElement(cv::MORPH_RECT, cv::Size(1 + niter, 1 + niter));
    cv::Mat roiSegMap = segMap(roi);
    cv::dilate(roiSegMap, roiSegMap, kernel);
    
    // Find minimal area rect
    std::vector<std::vector<cv::Point>> contours;
    cv::findContours(segMap, contours, cv::RETR_EXTERNAL, cv::CHAIN_APPROX_SIMPLE);
    if (!contours.empty()) {
      cv::RotatedRect minRect = cv::minAreaRect(contours[0]);
      cv::Point2f vertices[4];
      minRect.points(vertices);
      NSMutableArray *pointsArray = [NSMutableArray arrayWithCapacity:4];
      for (int j = 0; j < 4; j++) {
        CGPoint point = CGPointMake(vertices[j].x, vertices[j].y);
        [pointsArray addObject:[NSValue valueWithCGPoint:point]];
      }
      NSDictionary *dict = @{@"box": pointsArray, @"angle": @(minRect.angle)};
      [detectedBoxes addObject:dict];
    }
  }
  
  return detectedBoxes;
}

+ (CGFloat)minimumYFromBox:(NSArray<NSValue *> *)box {
  __block CGFloat minY = CGFLOAT_MAX;
  [box enumerateObjectsUsingBlock:^(NSValue * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
    CGPoint pt = [obj CGPointValue];
    if (pt.y < minY) {
      minY = pt.y;
    }
  }];
  return minY;
}

+ (NSArray<NSDictionary *> *)groupTextBoxes:(NSArray<NSDictionary *> *)polys
                            centerThreshold:(CGFloat)centerThreshold
                          distanceThreshold:(CGFloat)distanceThreshold
                            heightThreshold:(CGFloat)heightThreshold
{
  // Sort polys by max side length in descending order
  NSMutableArray<NSDictionary *> *sortedPolys = [polys sortedArrayUsingComparator:^NSComparisonResult(NSDictionary *obj1, NSDictionary *obj2) {
    CGFloat maxLen1 = [self maxSideLength:obj1[@"box"]];
    CGFloat maxLen2 = [self maxSideLength:obj2[@"box"]];
    return (maxLen1 < maxLen2) ? NSOrderedDescending : (maxLen1 > maxLen2) ? NSOrderedAscending : NSOrderedSame;
  }].mutableCopy;
  
  NSMutableArray<NSDictionary *> *mergedList = [NSMutableArray array];
  CGFloat angleDegrees;
  while (sortedPolys.count > 0) {
    NSMutableDictionary *currentBox = [sortedPolys[0] mutableCopy];
    [sortedPolys removeObjectAtIndex:0];
    CGFloat currentAngle = [self normalizeAngle:[currentBox[@"angle"] floatValue]];
    NSMutableArray<NSNumber *> *ignoredIdxs = [NSMutableArray array];
    
    while (YES) {
      NSDictionary *lineFit = [self fitLineToShortestSides:currentBox[@"box"]];
      NSLog(@"lineFit: %@", lineFit);
      angleDegrees = atan([lineFit[@"slope"] floatValue]) * 180 / M_PI;
      if ([lineFit[@"isVertical"] boolValue]){
        angleDegrees = -90;
      }
      CGFloat mergedHeight = [self minSideLength:currentBox[@"box"]];
      NSDictionary *closestBoxInfo = [self findClosestBox:sortedPolys ignoredIdxs:[NSSet setWithArray:ignoredIdxs] currentBox:currentBox[@"box"] isVertical:[lineFit[@"isVertical"] boolValue] m:[lineFit[@"slope"] floatValue] c:[lineFit[@"intercept"] floatValue] centerThreshold:centerThreshold];
      if (closestBoxInfo == nil) break;
      
      NSMutableDictionary *candidateBox = [closestBoxInfo[@"boxToMerge"] mutableCopy];
      NSInteger candidateIdx = [closestBoxInfo[@"idx"] integerValue];
      CGFloat candidateHeight = [closestBoxInfo[@"boxHeight"] floatValue];
      if (([candidateBox[@"angle"]  isEqual: @90] && ![lineFit[@"isVertical"] boolValue]) || ([candidateBox[@"angle"] isEqual: @0] && [lineFit[@"isVertical"] boolValue])) {
        candidateBox[@"coords"] = [self rotateBox:candidateBox[@"coords"] withAngle:currentAngle];
      }
      CGFloat minDistance = [self calculateMinimalDistance:candidateBox[@"coords"] corners2:currentBox[@"box"]];
      if (minDistance < distanceThreshold * candidateHeight && fabs(mergedHeight - candidateHeight) < mergedHeight * heightThreshold) {
        currentBox[@"box"] = [self mergeRotatedBoxes:currentBox[@"box"] withBox:candidateBox[@"coords"]];
        [sortedPolys removeObjectAtIndex:candidateIdx];
        [ignoredIdxs removeAllObjects];  // Restart with new merged box
      } else {
        [ignoredIdxs addObject:@(candidateIdx)];
      }
    }
    [mergedList addObject:@{@"box" : currentBox[@"box"], @"angle" : @(angleDegrees)}];
  }
  
  // Optionally sort by angle if needed
  NSArray<NSDictionary *> *sortedBoxes = [mergedList sortedArrayUsingComparator:^NSComparisonResult(NSDictionary *obj1, NSDictionary *obj2) {
    NSArray<NSValue *> *coords1 = obj1[@"box"];
    NSArray<NSValue *> *coords2 = obj2[@"box"];
    CGFloat minY1 = [self minimumYFromBox:coords1];
    CGFloat minY2 = [self minimumYFromBox:coords2];
    return (minY1 < minY2) ? NSOrderedAscending : (minY1 > minY2) ? NSOrderedDescending : NSOrderedSame;
  }];
  
  return sortedBoxes;
}

@end
