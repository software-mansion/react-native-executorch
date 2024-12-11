#import <UIKit/UIKit.h>
#import "BaseModel.h"
#import <opencv2/opencv.hpp>

@interface StyleTransferModel : BaseModel

- (cv::Mat)runModel:(cv::Mat &)input;

@end
