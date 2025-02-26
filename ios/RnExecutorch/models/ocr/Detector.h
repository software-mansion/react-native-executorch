#import "BaseModel.h"
#import "RecognitionHandler.h"
#import "opencv2/opencv.hpp"

constexpr CGFloat textThreshold = 0.4;
constexpr CGFloat textThresholdVertical = 0.3;
constexpr CGFloat linkThreshold = 0.4;
constexpr CGFloat lowTextThreshold = 0.7;
constexpr CGFloat centerThreshold = 0.5;
constexpr CGFloat distanceThreshold = 2.0;
constexpr CGFloat heightThreshold = 2.0;
constexpr CGFloat restoreRatio = 3.2;
constexpr CGFloat restoreRatioVertical = 2.0;
constexpr int minSideThreshold = 15;
constexpr int maxSideThreshold = 30;
constexpr int maxWidth = largeModelWidth + (largeModelWidth * 0.15);
constexpr int minSize = 20;

const cv::Scalar mean(0.485, 0.456, 0.406);
const cv::Scalar variance(0.229, 0.224, 0.225);

@interface Detector : BaseModel

- (instancetype)initWithIsVertical:(BOOL)isVertical detectSingleCharacters:(BOOL)detectSingleCharacters;
- (cv::Size)getModelImageSize;
- (NSArray *)runModel:(cv::Mat &)input;

@end
