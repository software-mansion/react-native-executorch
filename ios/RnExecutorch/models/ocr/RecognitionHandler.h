#import "opencv2/opencv.hpp"

@interface RecognitionHandler : NSObject

- (NSArray *)recognize:(NSArray *)horizontalList imgGray:(cv::Mat)imgGray desiredWidth:(int)desiredWidth desiredHeight:(int)desiredHeight;

@end
