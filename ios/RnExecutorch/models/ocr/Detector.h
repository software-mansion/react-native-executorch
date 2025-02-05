#import "opencv2/opencv.hpp"
#import "BaseModel.h"

constexpr float textThreshold = 0.7;
constexpr float linkThreshold = 0.4;
constexpr float lowText = 0.4;
constexpr CGFloat centerThreshold = 0.5;
constexpr CGFloat distanceThreshold = 2.0;
constexpr CGFloat heightThreshold = 2.0;
constexpr int minSize = 20;
const cv::Scalar mean(0.485, 0.456, 0.406);
const cv::Scalar variance(0.229, 0.224, 0.225);

@interface Detector : BaseModel

- (cv::Size)getModelImageSize;
- (NSArray *)runModel:(cv::Mat &)input;

@end
