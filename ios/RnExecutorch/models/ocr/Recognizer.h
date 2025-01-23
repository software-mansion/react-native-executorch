#import "BaseModel.h"
#import "opencv2/opencv.hpp"

@interface Recognizer : BaseModel

- (cv::Size)getModelImageSize;
- (NSArray *)preprocess:(cv::Mat &)input;
- (NSArray *)postprocess:(NSArray *)output;
- (NSArray *)runModel:(cv::Mat &)input;

@end
