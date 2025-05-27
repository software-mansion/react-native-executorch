#import "BaseModel.h"
#import "opencv2/opencv.hpp"

@interface VerticalDetector : BaseModel

- (instancetype)initWithDetectSingleCharacters:(BOOL)detectSingleCharacters;
- (cv::Size)getModelImageSize;
- (NSArray *)runModel:(cv::Mat &)input;

@end
