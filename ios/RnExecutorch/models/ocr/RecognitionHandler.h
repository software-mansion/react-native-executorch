#import "opencv2/opencv.hpp"

const int modelHeight = 64;
const int largeModelWidth = 512;
const int mediumModelWidth = 256;
const int smallModelWidth = 128;

@interface RecognitionHandler : NSObject

- (void)loadRecognizers:(NSString *)largeRecognizerPath mediumRecognizerPath:(NSString *)mediumRecognizerPath smallRecognizerPath:(NSString *)smallRecognizerPath completion:(void (^)(BOOL, NSNumber *))completion;
- (NSArray *)recognize:(NSArray *)horizontalList imgGray:(cv::Mat)imgGray desiredWidth:(int)desiredWidth desiredHeight:(int)desiredHeight;

@end
