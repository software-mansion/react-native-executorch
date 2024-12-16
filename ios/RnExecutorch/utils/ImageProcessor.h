#import <UIKit/UIKit.h>
#import <opencv2/opencv.hpp>

@interface ImageProcessor : NSObject

+ (NSArray *)matToNSArray:(const cv::Mat &)mat;
+ (cv::Mat)arrayToMat:(NSArray *)array width:(int)width height:(int)height;
+ (NSString *)saveToTempFile:(const cv::Mat &)image;
+ (cv::Mat)readImage:(NSString *)source;

@end
