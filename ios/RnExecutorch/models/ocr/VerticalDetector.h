#import "BaseModel.h"
#import "RecognitionHandler.h"
#import "opencv2/opencv.hpp"
#import "utils/Constants.h"

@interface VerticalDetector : BaseModel

- (instancetype)initWithDetectSingleCharacters:(BOOL)detectSingleCharacters;
- (cv::Size)getModelImageSize;
- (NSArray *)runModel:(cv::Mat &)input;

@end
