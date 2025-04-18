#import "../BaseModel.h"
#import <UIKit/UIKit.h>
#include <opencv2/opencv.hpp>

@interface SSDLiteLargeModel : BaseModel

- (NSArray *)runModel:(cv::Mat)input;
- (NSArray *)preprocess:(cv::Mat)input;
- (NSArray *)postprocess:(NSArray *)input;

@end
