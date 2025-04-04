#import "BaseModel.h"
#import "opencv2/opencv.hpp"

@interface Detector : BaseModel

- (cv::Size)getModelImageSize;
- (NSArray *)runModel:(cv::Mat &)input;

@end
