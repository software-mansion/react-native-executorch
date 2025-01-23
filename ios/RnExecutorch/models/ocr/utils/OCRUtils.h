#import <opencv2/opencv.hpp>

@interface OCRUtils : NSObject

+ (cv::Mat)resizeWithPadding:(cv::Mat)img desiredWidth:(int)desiredWidth desiredHeight:(int)desiredHeight;
+ (CGFloat)calculateRatioWithWidth:(int)width height:(int)height;
+ (cv::Mat)computeRatioAndResize:(cv::Mat)img width:(int)width height:(int)height modelHeight:(int)modelHeight;
+ (cv::Mat)normalizeForRecognizer:(cv::Mat)image adjustContrast:(double)adjustContrast;
+ (cv::Mat)adjustContrastGrey:(cv::Mat)img target:(double)target;

@end
