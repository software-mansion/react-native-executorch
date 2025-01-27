#import "DetectorUtils.h"

@implementation DetectorUtils

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

+ (NSArray *)restoreBboxRatio:(NSArray *)boxes {
  NSMutableArray *result = [NSMutableArray array];
  for (NSUInteger i = 0; i < [boxes count]; i++) {
    NSArray *box = boxes[i];
    NSMutableArray *boxArray = [NSMutableArray arrayWithCapacity:4];
    for (NSValue *value in box) {
      CGPoint point = [value CGPointValue];
      point.x *= 2;
      point.y *= 2;
      [boxArray addObject:@((int)point.x)];
      [boxArray addObject:@((int)point.y)];
    }
    [result addObject:boxArray];
  }
  
  return result;
}

+ (NSArray *)getDetBoxes:(cv::Mat)textmap linkMap:(cv::Mat)linkmap textThreshold:(double)textThreshold linkThreshold:(double)linkThreshold lowText:(double)lowText {
  cv::Mat textmapCopy = textmap.clone();
  cv::Mat linkmapCopy = linkmap.clone();
  int img_h = textmap.rows;
  int img_w = textmap.cols;
  cv::Mat textScore, linkScore;
  cv::threshold(textmapCopy, textScore, lowText, 1, 0);
  cv::threshold(linkmapCopy, linkScore, linkThreshold, 1, 0);
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
    cv::minMaxLoc(textmapCopy, NULL, &maxVal, NULL, NULL, mask);
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
      [detectedBoxes addObject:pointsArray];
    }
  }
  
  return detectedBoxes;
}

+ (NSMutableArray *)prepareBoxesFromPolys:(NSArray *)polys {
  NSMutableArray *boxes = [NSMutableArray array];
  for (NSArray *poly in polys) {
    NSArray *xCoords = @[poly[0], poly[2], poly[4], poly[6]];
    NSArray *yCoords = @[poly[1], poly[3], poly[5], poly[7]];
    NSNumber *xMin = [xCoords valueForKeyPath:@"@min.self"];
    NSNumber *xMax = [xCoords valueForKeyPath:@"@max.self"];
    NSNumber *yMin = [yCoords valueForKeyPath:@"@min.self"];
    NSNumber *yMax = [yCoords valueForKeyPath:@"@max.self"];
    [boxes addObject:@[xMin, xMax, yMin, yMax, @(([yMin floatValue] + [yMax floatValue]) / 2.0), @([yMax floatValue] - [yMin floatValue])]];
  }
  return boxes;
}

+ (NSMutableArray *)combineBoxes:(NSMutableArray *)boxes withYCenterThs:(CGFloat)ycenterThs heightThs:(CGFloat)heightThs {
  NSMutableArray *combinedBoxes = [NSMutableArray array];
  NSMutableArray *currentGroup = [NSMutableArray array];
  
  for (NSArray *box in boxes) {
    if (currentGroup.count == 0) {
      [currentGroup addObject:box];
    } else {
      NSArray *lastBox = [currentGroup lastObject];
      BOOL closeYCenter = fabs([[lastBox objectAtIndex:4] floatValue] - [[box objectAtIndex:4] floatValue]) < ycenterThs * [[lastBox objectAtIndex:5] floatValue];
      if (closeYCenter) {
        [currentGroup addObject:box];
      } else {
        [combinedBoxes addObject:[currentGroup copy]];
        currentGroup = [@[box] mutableCopy];
      }
    }
  }
  if (currentGroup.count > 0) {
    [combinedBoxes addObject:[currentGroup copy]];
  }
  return combinedBoxes;
}

+ (NSArray *)mergeBoxes:(NSMutableArray *)combinedBoxes withWidthThs:(CGFloat)widthThs heightThs:(CGFloat)heightThs addMargin:(CGFloat)addMargin {
  NSMutableArray *mergedList = [NSMutableArray array];
  
  for (NSArray *group in combinedBoxes) {
    if (group.count == 1) {
      NSArray *box = group[0];
      float margin = addMargin * MIN([[box objectAtIndex:1] floatValue] - [[box objectAtIndex:0] floatValue], [[box objectAtIndex:5] floatValue]);
      [mergedList addObject:@[@([[box objectAtIndex:0] floatValue] - margin), @([[box objectAtIndex:1] floatValue] + margin), @([[box objectAtIndex:2] floatValue] - margin), @([[box objectAtIndex:3] floatValue] + margin)]];
    } else {
      NSArray *sortedBoxes = [group sortedArrayUsingComparator:^NSComparisonResult(NSArray *obj1, NSArray *obj2) {
        return [@([obj1[0] intValue]) compare:@([obj2[0] intValue])];
      }];
      
      NSMutableArray *mergedBox = [NSMutableArray array];
      NSMutableArray *newBox = [NSMutableArray array];
      int xMax = 0;
      NSMutableArray *bHeight = [NSMutableArray array];
      
      for (NSArray *box in sortedBoxes) {
        if ([newBox count] == 0) {
          [bHeight addObject:box[5]];
          xMax = [box[1] intValue];
          [newBox addObject:box];
        } else {
          int currHeight = [box[5] intValue];
          float meanHeight = [[bHeight valueForKeyPath:@"@avg.self"] floatValue];
          if (fabs(meanHeight - currHeight) < heightThs * meanHeight &&
              ([box[0] intValue] - xMax) < widthThs * ([box[3] intValue] - [box[2] intValue])) {
            [bHeight addObject:box[5]];
            xMax = [box[1] intValue];
            [newBox addObject:box];
          } else {
            [mergedBox addObject:[newBox copy]];
            newBox = [@[box] mutableCopy];
            bHeight = [@[box[5]] mutableCopy];
            xMax = [box[1] intValue];
          }
        }
      }
      if ([newBox count] > 0) {
        [mergedBox addObject:newBox];
      }
      
      for (NSArray *mbox in mergedBox) {
        if ([mbox count] != 1) {
          NSNumber *xMin = [mbox[0] objectAtIndex:0];
          NSNumber *xMax = [mbox[0] objectAtIndex:1];
          NSNumber *yMin = [mbox[0] objectAtIndex:2];
          NSNumber *yMax = [mbox[0] objectAtIndex:3];
          for (NSArray *box in mbox) {
            if ([box[0] intValue] < [xMin intValue]) {
              xMin = box[0];
            }
            if([box[1] intValue] > [xMax intValue]) {
              xMax = box[1];
            }
            if ([box[2] intValue] < [yMin intValue]) {
              yMin = box[2];
            }
            if ([box[3] intValue] > [yMax intValue]) {
              yMax = box[3];
            }
          }
          
          int margin = (int)(addMargin * MIN([xMax floatValue] - [xMin floatValue], [yMax floatValue] - [yMin floatValue]));
          [mergedList addObject:@[@([xMin intValue] - margin),
                                  @([xMax intValue] + margin),
                                  @([yMin intValue] - margin),
                                  @([yMax intValue] + margin)]];
        } else {
          NSArray *box = mbox[0];
          int margin = (int)(addMargin * MIN([box[1] floatValue] - [box[0] floatValue], [box[3] floatValue] - [box[2] floatValue]));
          [mergedList addObject:@[@([box[0] intValue] - margin),
                                  @([box[1] intValue] + margin),
                                  @([box[2] intValue] - margin),
                                  @([box[3] intValue] + margin)]];
        }
      }
      
    }
  }
  
  return [mergedList copy];
}

+ (NSArray<NSArray<NSNumber *> *> *)groupTextBox:(NSArray<NSArray<NSNumber *> *> *)polys
                                      ycenterThs:(CGFloat)ycenterThs
                                       heightThs:(CGFloat)heightThs
                                        widthThs:(CGFloat)widthThs
                                       addMargin:(CGFloat)addMargin
{
  NSMutableArray *horizontalList = [self prepareBoxesFromPolys:polys];
  NSMutableArray *combinedList = [self combineBoxes:horizontalList withYCenterThs:ycenterThs heightThs:heightThs];
  return [self mergeBoxes:combinedList withWidthThs:widthThs heightThs:heightThs addMargin:addMargin];
}

@end
