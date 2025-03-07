#import "../BaseModel.h"
#import "opencv2/opencv.hpp"

@interface ImageSegmentationModel : BaseModel
- (cv::Size)getModelImageSize;
- (NSDictionary *)runModel:(cv::Mat &)input
                  returnClasses:(NSArray *)classesOfInterest;

@end