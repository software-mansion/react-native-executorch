#import <React/RCTBridgeModule.h>
#import "ExecutorchLib/ETModel.h"
#import "../../utils/Fetcher.h"
#import "../../utils/ImageProcessor.h"
#import "./utils/CTCLabelConverter.h"
#import "./utils/OCRUtils.h"
#import "./utils/RecognizerUtils.h"
#import "Recognizer.h"
#import "RecognitionHandler.h"

/*
 RecognitionHandler class is responsible for loading and choosing the appropriate recognizer model based on the input image size,
 it also handles converting the model output to text.
 */

@implementation RecognitionHandler {
  Recognizer *recognizerLarge;
  Recognizer *recognizerMedium;
  Recognizer *recognizerSmall;
  CTCLabelConverter *converter;
}

- (instancetype)initWithSymbols:(NSString *)symbols languageDictPath:(NSString *)languageDictPath {
  self = [super init];
  if (self) {
    recognizerLarge = [[Recognizer alloc] init];
    recognizerMedium = [[Recognizer alloc] init];
    recognizerSmall = [[Recognizer alloc] init];
    
    converter = [[CTCLabelConverter alloc] initWithCharacters:symbols separatorList:@{} dictPathList:@{@"key": languageDictPath}];
  }
  return self;
}

- (void)loadRecognizers:(NSString *)largeRecognizerPath mediumRecognizerPath:(NSString *)mediumRecognizerPath smallRecognizerPath:(NSString *)smallRecognizerPath completion:(void (^)(BOOL, NSNumber *))completion {
  dispatch_group_t group = dispatch_group_create();
  __block BOOL allSuccessful = YES;
  
  NSArray<Recognizer *> *recognizers = @[recognizerLarge, recognizerMedium, recognizerSmall];
  NSArray<NSString *> *paths = @[largeRecognizerPath, mediumRecognizerPath, smallRecognizerPath];
  
  for (NSInteger i = 0; i < recognizers.count; i++) {
    Recognizer *recognizer = recognizers[i];
    NSString *path = paths[i];
    
    dispatch_group_enter(group);
    [recognizer loadModel:[NSURL URLWithString: path] completion:^(BOOL success, NSNumber *errorCode) {
      if (!success) {
        allSuccessful = NO;
        dispatch_group_leave(group);
        completion(NO, errorCode);
        return;
      }
      dispatch_group_leave(group);
    }];
  }
  
  dispatch_group_notify(group, dispatch_get_main_queue(), ^{
    if (allSuccessful) {
      completion(YES, @(0));
    }
  });
}

- (NSArray *)recognize: (NSArray *)horizontalList imgGray:(cv::Mat)imgGray desiredWidth:(int)desiredWidth desiredHeight:(int)desiredHeight {
  imgGray = [OCRUtils resizeWithPadding:imgGray desiredWidth:desiredWidth desiredHeight:desiredHeight];
  NSMutableArray *predictions = [NSMutableArray array];
  NSLog(@"%@", horizontalList);
  for (NSDictionary *box in horizontalList) {
    cv::Mat croppedImage = [RecognizerUtils getCroppedImage:box image:imgGray modelHeight:modelHeight];
    croppedImage = [RecognizerUtils normalizeForRecognizer:croppedImage adjustContrast:0.2];
    NSArray *result;
    if(croppedImage.cols >= largeModelWidth) {
      result = [recognizerLarge runModel:croppedImage];
    } else if (croppedImage.cols >= mediumModelWidth) {
      result = [recognizerMedium runModel: croppedImage];
    } else {
      result = [recognizerSmall runModel: croppedImage];
    }
    
    NSNumber *confidenceScore = [result objectAtIndex:1];
    if([confidenceScore floatValue] < 0.3){
      cv::rotate(croppedImage, croppedImage, cv::ROTATE_180);
    }
    NSArray *rotatedResult;
    if(croppedImage.cols >= largeModelWidth) {
      rotatedResult = [recognizerLarge runModel:croppedImage];
    } else if (croppedImage.cols >= mediumModelWidth) {
      rotatedResult = [recognizerMedium runModel: croppedImage];
    } else {
      rotatedResult = [recognizerSmall runModel: croppedImage];
    }
    NSNumber *rotatedConfidenceScore = [rotatedResult objectAtIndex:1];
    
    if ([rotatedConfidenceScore floatValue] > [confidenceScore floatValue]) {
      result = rotatedResult;
    }
    
    NSArray *pred_index = [result objectAtIndex:0];
    
    NSArray* decodedTexts = [converter decodeGreedy:pred_index length:(int)(pred_index.count)];

    NSDictionary *res = @{@"text": decodedTexts[0], @"bbox": box[@"box"], @"score": confidenceScore};
    [predictions addObject:res];
  }
  
  return predictions;
}

@end

