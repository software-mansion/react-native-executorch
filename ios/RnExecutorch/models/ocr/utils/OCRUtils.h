#import <opencv2/opencv.hpp>

@interface OCRUtils : NSObject

+ (cv::Mat)resizeWithPadding:(cv::Mat)img
                desiredWidth:(int)desiredWidth
               desiredHeight:(int)desiredHeight;

@end
