#import "opencv2/opencv.hpp"
#import "BaseModel.h"

@interface Recognizer : BaseModel

- (NSArray *)runModel:(cv::Mat &)input;

@end
