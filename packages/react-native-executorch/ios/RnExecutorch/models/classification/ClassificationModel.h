#import "BaseModel.h"
#import "opencv2/opencv.hpp"

@interface ClassificationModel : BaseModel

- (NSArray *)preprocess:(cv::Mat &)input;
- (NSDictionary *)runModel:(cv::Mat &)input;
- (NSDictionary *)postprocess:(NSArray *)output;

@end
