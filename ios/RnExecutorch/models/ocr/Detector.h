#import "BaseModel.h"
#import "RecognitionHandler.h"
#import "opencv2/opencv.hpp"
#import "utils/Constants.h"

@interface Detector : BaseModel

- (cv::Size)getModelImageSize;
- (NSArray *)runModel:(cv::Mat &)input;

@end
