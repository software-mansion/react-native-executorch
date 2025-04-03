#import "BaseModel.h"
#import "RecognitionHandler.h"

@interface Detector : BaseModel

- (cv::Size)getModelImageSize;
- (NSArray *)runModel:(cv::Mat &)input;

@end
