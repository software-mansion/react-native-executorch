#import <opencv2/opencv.hpp>

@interface OCRUtils : NSObject

+ (cv::Mat)resizeWithPadding:(cv::Mat)img desiredWidth:(int)desiredWidth desiredHeight:(int)desiredHeight;
+ (cv::Mat)getCroppedImage:(int)x_max x_min:(int)x_min y_max:(int)y_max y_min:(int)y_min image:(cv::Mat)image modelHeight:(int)modelHeight;
+ (CGFloat)calculateRatioWithWidth:(int)width height:(int)height;
+ (cv::Mat)computeRatioAndResize:(cv::Mat)img width:(int)width height:(int)height modelHeight:(int)modelHeight;
+ (cv::Mat)normalizeForRecognizer:(cv::Mat)image adjustContrast:(double)adjustContrast;
+ (cv::Mat)adjustContrastGrey:(cv::Mat)img target:(double)target;

@end
