#import "BaseModel.h"
#import "opencv2/opencv.hpp"

const float textThreshold = 0.7;
const float linkThreshold = 0.4;
const float lowText = 0.4;
const float yCenterThs = 0.5;
const float heightThs = 0.5;
const float widthThs = 0.5;
const float addMargin = 0.1;
const int minSize = 20;

@interface Detector : BaseModel
- (cv::Size)getModelImageSize;
- (NSArray *)preprocess:(cv::Mat &)input;
- (NSArray *)postprocess:(NSArray *)output;
- (NSArray *)runModel:(cv::Mat &)input;

@end
