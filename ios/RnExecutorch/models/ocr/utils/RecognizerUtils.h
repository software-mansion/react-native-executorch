#import <opencv2/opencv.hpp>

@interface RecognizerUtils : NSObject

+ (NSArray<NSNumber *> *)indicesOfMaxValuesInMatrix:(cv::Mat)matrix;
+ (cv::Mat)divideMatrix:(cv::Mat)matrix byVector:(NSArray<NSNumber *> *)vector;
+ (cv::Mat)softmax:(cv::Mat)inputs;
+ (NSDictionary *)calculateResizeRatioAndPaddings:(int)width height:(int)height desiredWidth:(int)desiredWidth desiredHeight:(int)desiredHeight;
+ (cv::Mat)getCroppedImage:(int)x_max x_min:(int)x_min y_max:(int)y_max y_min:(int)y_min image:(cv::Mat)image modelHeight:(int)modelHeight;

@end
