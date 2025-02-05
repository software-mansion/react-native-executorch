#import <opencv2/opencv.hpp>

@interface DetectorUtils : NSObject

+ (NSDictionary *)splitInterleavedNSArray:(NSArray *)array;
+ (NSArray *)restoreBboxRatio:(NSArray *)boxes;
+ (NSArray *)getDetBoxes:(cv::Mat)textmap linkMap:(cv::Mat)linkmap textThreshold:(double)textThreshold linkThreshold:(double)linkThreshold lowText:(double)lowText;
+ (NSArray<NSDictionary *> *)groupTextBoxes:(NSArray<NSDictionary *> *)polys
                            centerThreshold:(CGFloat)centerThreshold
                          distanceThreshold:(CGFloat)distanceThreshold
                            heightThreshold:(CGFloat)heightThreshold;

@end
