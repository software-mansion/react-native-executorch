#import "BaseModel.h"
#import "opencv2/opencv.hpp"

@interface StyleTransferModel : BaseModel

- (cv::Size)getModelImageSize;
- (NSArray *)preprocess:(cv::Mat &)input;
- (cv::Mat)postprocess:(NSArray *)output;
- (cv::Mat)runModel:(cv::Mat &)input;

@end
