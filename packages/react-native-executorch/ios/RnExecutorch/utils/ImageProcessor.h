#import <opencv2/opencv.hpp>

@interface ImageProcessor : NSObject

+ (NSArray *)matToNSArray:(const cv::Mat &)mat
                     mean:(cv::Scalar)mean
                 variance:(cv::Scalar)variance;
+ (NSArray *)matToNSArray:(const cv::Mat &)mat;
+ (cv::Mat)arrayToMat:(NSArray *)array width:(int)width height:(int)height;
+ (cv::Mat)arrayToMatGray:(NSArray *)array width:(int)width height:(int)height;
+ (NSArray *)matToNSArrayGray:(const cv::Mat &)mat;
+ (NSString *)saveToTempFile:(const cv::Mat &)image;
+ (cv::Mat)readImage:(NSString *)source;

@end
