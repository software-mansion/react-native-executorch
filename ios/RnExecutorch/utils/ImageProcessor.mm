#import "ImageProcessor.h"
#import <CoreGraphics/CoreGraphics.h>

@implementation ImageProcessor

+ (NSArray *)matToNSArray:(const cv::Mat &)mat {
  int pixelCount = mat.cols * mat.rows;
  NSMutableArray *floatArray = [[NSMutableArray alloc] initWithCapacity:pixelCount * 3];
  for (NSUInteger k = 0; k < pixelCount * 3; k++) {
    [floatArray addObject:@0.0];
  }
  
  for (int i = 0; i < pixelCount; i++) {
    int row = i / mat.cols;
    int col = i % mat.cols;
    cv::Vec3b pixel = mat.at<cv::Vec3b>(row, col);
    floatArray[i] = @(pixel[2] / 255.0f);
    floatArray[pixelCount + i] = @(pixel[1] / 255.0f);
    floatArray[2 * pixelCount + i] = @(pixel[0] / 255.0f);
  }
  
  return floatArray;
}

+ (cv::Mat)arrayToMat:(NSArray *)array width:(int)width height:(int)height {
  cv::Mat mat(height, width, CV_8UC3);
  
  int pixelCount = width * height;
  for (int i = 0; i < pixelCount; i++) {
    int row = i / width;
    int col = i % width;
    float r = 0, g = 0, b = 0;
    
    r = [[array objectAtIndex: i] floatValue];
    g = [[array objectAtIndex: pixelCount + i] floatValue];
    b = [[array objectAtIndex: 2 * pixelCount + i] floatValue];
    
    cv::Vec3b color((uchar)(b * 255), (uchar)(g * 255), (uchar)(r * 255));
    mat.at<cv::Vec3b>(row, col) = color;
  }
  
  return mat;
}


@end
