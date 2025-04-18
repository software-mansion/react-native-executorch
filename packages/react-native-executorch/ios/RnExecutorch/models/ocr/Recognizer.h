#import "BaseModel.h"
#import "opencv2/opencv.hpp"

@interface Recognizer : BaseModel

- (NSArray *)runModel:(cv::Mat &)input;

@end
