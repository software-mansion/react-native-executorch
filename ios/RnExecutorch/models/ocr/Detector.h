#import "opencv2/opencv.hpp"
#import "BaseModel.h"

const float textThreshold = 0.7;
const float linkThreshold = 0.4;
const float lowText = 0.4;
const float yCenterThs = 0.5;
const float heightThs = 0.5;
const float widthThs = 0.5;
const float addMargin = 0.1;
const int minSize = 20;
const cv::Scalar mean(0.485, 0.456, 0.406);
const cv::Scalar variance(0.229, 0.224, 0.225);

@interface Detector : BaseModel

- (cv::Size)getModelImageSize;
- (NSArray *)runModel:(cv::Mat &)input;

@end
