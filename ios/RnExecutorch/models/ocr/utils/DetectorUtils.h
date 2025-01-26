#import <opencv2/opencv.hpp>

@interface DetectorUtils : NSObject

+ (NSDictionary *)splitInterleavedNSArray:(NSArray *)array;
+ (NSArray *)restoreBboxRatio:(NSArray *)boxes;
+ (NSArray *)getDetBoxes:(cv::Mat)textmap linkMap:(cv::Mat)linkmap textThreshold:(double)textThreshold linkThreshold:(double)linkThreshold lowText:(double)lowText;
+ (NSArray<NSArray<NSNumber *> *> *)groupTextBox:(NSArray<NSArray<NSNumber *> *> *)polys
                                      ycenterThs:(CGFloat)ycenterThs
                                       heightThs:(CGFloat)heightThs
                                        widthThs:(CGFloat)widthThs
                                       addMargin:(CGFloat)addMargin;

@end
