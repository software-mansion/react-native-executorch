#import "opencv2/opencv.hpp"

@interface RecognitionHandler : NSObject

- (instancetype)initWithSymbols:(NSString *)symbols;

- (NSNumber *)loadRecognizers:(NSString *)largeRecognizerPath
         mediumRecognizerPath:(NSString *)mediumRecognizerPath
          smallRecognizerPath:(NSString *)smallRecognizerPath;

- (NSArray *)recognize:(NSArray<NSDictionary *> *)bBoxesList
               imgGray:(cv::Mat)imgGray
          desiredWidth:(int)desiredWidth
         desiredHeight:(int)desiredHeight;

@end
