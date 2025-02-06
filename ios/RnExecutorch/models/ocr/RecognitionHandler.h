#import "opencv2/opencv.hpp"

constexpr int modelHeight = 64;
constexpr int largeModelWidth = 512;
constexpr int mediumModelWidth = 256;
constexpr int smallModelWidth = 128;
constexpr CGFloat lowConfidenceThreshold = 0.3;
constexpr CGFloat adjustContrast = 0.2;

@interface RecognitionHandler : NSObject

- (instancetype)initWithSymbols:(NSString *)symbols languageDictPath:(NSString *)languageDictPath;
- (void)loadRecognizers:(NSString *)largeRecognizerPath mediumRecognizerPath:(NSString *)mediumRecognizerPath smallRecognizerPath:(NSString *)smallRecognizerPath completion:(void (^)(BOOL, NSNumber *))completion;
- (NSArray *)recognize:(NSArray<NSDictionary *> *)bBoxesList imgGray:(cv::Mat)imgGray desiredWidth:(int)desiredWidth desiredHeight:(int)desiredHeight;

@end
