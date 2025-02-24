#import <opencv2/opencv.hpp>

@interface RecognizerUtils : NSObject

+ (CGFloat)calculateRatio:(int)width height:(int)height;
+ (cv::Mat)computeRatioAndResize:(cv::Mat)img
                           width:(int)width
                          height:(int)height
                     modelHeight:(int)modelHeight;
+ (cv::Mat)normalizeForRecognizer:(cv::Mat)image
                   adjustContrast:(double)adjustContrast;
+ (cv::Mat)adjustContrastGrey:(cv::Mat)img target:(double)target;
+ (cv::Mat)divideMatrix:(cv::Mat)matrix byVector:(NSArray<NSNumber *> *)vector;
+ (cv::Mat)softmax:(cv::Mat)inputs;
+ (NSDictionary *)calculateResizeRatioAndPaddings:(int)width
                                           height:(int)height
                                     desiredWidth:(int)desiredWidth
                                    desiredHeight:(int)desiredHeight;
+ (cv::Mat)getCroppedImage:(NSDictionary *)box
                     image:(cv::Mat)image
               modelHeight:(int)modelHeight;
+ (NSMutableArray *)sumProbabilityRows:(cv::Mat)probabilities
                     modelOutputHeight:(int)modelOutputHeight;
+ (NSArray *)findMaxValuesAndIndices:(cv::Mat)probabilities;
+ (double)computeConfidenceScore:(NSArray<NSNumber *> *)valuesArray
                    indicesArray:(NSArray<NSNumber *> *)indicesArray;

@end
