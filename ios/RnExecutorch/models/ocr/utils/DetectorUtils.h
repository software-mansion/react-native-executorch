#import <opencv2/opencv.hpp>

constexpr int verticalLineThreshold = 20;

@interface DetectorUtils : NSObject

+ (void)interleavedArrayToMats:(NSArray *)array
                    outputMat1:(cv::Mat &)mat1
                    outputMat2:(cv::Mat &)mat2
                      withSize:(cv::Size)size;
+ (NSArray *)getDetBoxesFromTextMap:(cv::Mat)textMap
                        affinityMap:(cv::Mat)affinityMap
                 usingTextThreshold:(CGFloat)textThreshold
                      linkThreshold:(CGFloat)linkThreshold
                   lowTextThreshold:(CGFloat)lowTextThreshold;
+ (NSArray *)getDetBoxesFromTextMapVertical:(cv::Mat)textMap
                                affinityMap:(cv::Mat)affinityMap
                         usingTextThreshold:(CGFloat)textThreshold
                              linkThreshold:(CGFloat)linkThreshold
                      independentCharacters:(BOOL)independentCharacters;
+ (NSArray *)restoreBboxRatio:(NSArray *)boxes
            usingRestoreRatio:(CGFloat)restoreRatio;
+ (NSArray *)groupTextBoxes:(NSArray<NSDictionary *> *)polys
                            centerThreshold:(CGFloat)centerThreshold
                          distanceThreshold:(CGFloat)distanceThreshold
                            heightThreshold:(CGFloat)heightThreshold
                           minSideThreshold:(int)minSideThreshold
                           maxSideThreshold:(int)maxSideThreshold
                                   maxWidth:(int)maxWidth;

@end
