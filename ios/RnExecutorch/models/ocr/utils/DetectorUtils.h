#import <opencv2/opencv.hpp>

@interface DetectorUtils : NSObject

+ (NSArray *)matToNSArray:(const cv::Mat &)mat;
+ (NSDictionary *)splitInterleavedNSArray:(NSArray *)array;
+ (cv::Mat)arrayToMat:(NSArray *)array width:(int)width height:(int)height;
+ (NSArray *)getDetBoxes:(cv::Mat)textmap linkMap:(cv::Mat)linkmap textThreshold:(double)textThreshold linkThreshold:(double)linkThreshold lowText:(double)lowText;
+ (NSArray<NSArray<NSNumber *> *> *)groupTextBox:(NSArray<NSArray<NSNumber *> *> *)polys
                                        slopeThs:(CGFloat)slopeThs
                                      ycenterThs:(CGFloat)ycenterThs
                                       heightThs:(CGFloat)heightThs
                                        widthThs:(CGFloat)widthThs
                                       addMargin:(CGFloat)addMargin;

@end
