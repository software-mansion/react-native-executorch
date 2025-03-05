#import "opencv2/opencv.hpp"

@interface RecognitionHandler : NSObject

- (instancetype)initWithSymbols:(NSString *)symbols;
- (void)loadRecognizers:(NSString *)largeRecognizerPath
    mediumRecognizerPath:(NSString *)mediumRecognizerPath
     smallRecognizerPath:(NSString *)smallRecognizerPath
              completion:(void (^)(BOOL, NSNumber *))completion;
- (NSArray *)recognize:(NSArray<NSDictionary *> *)bBoxesList
               imgGray:(cv::Mat)imgGray
          desiredWidth:(int)desiredWidth
         desiredHeight:(int)desiredHeight;

@end
