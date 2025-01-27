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

- (instancetype)init {
  self = [super init];
  if (self) {
    recognizerLarge = [[Recognizer alloc] init];
    recognizerMedium = [[Recognizer alloc] init];
    recognizerSmall = [[Recognizer alloc] init];
    NSString *dictPath = [[NSBundle mainBundle] pathForResource:@"en" ofType:@"txt"];
    converter = [[CTCLabelConverter alloc] initWithCharacters:@"0123456789!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ €ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" separatorList:@{} dictPathList:@{@"en": dictPath}];
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
  NSDictionary* ratioAndPadding = [RecognizerUtils calculateResizeRatioAndPaddings:imgGray.cols height:imgGray.rows desiredWidth:desiredWidth desiredHeight:desiredHeight];
  
  int left = [ratioAndPadding[@"left"] intValue];
  int top = [ratioAndPadding[@"top"] intValue];
  float resizeRatio = [ratioAndPadding[@"resizeRatio"] floatValue];
  imgGray = [OCRUtils resizeWithPadding:imgGray desiredWidth:desiredWidth desiredHeight:desiredHeight];
  
  NSMutableArray *predictions = [NSMutableArray array];
  for (NSArray *box in horizontalList) {
    int maximum_y = imgGray.rows;
    int maximum_x = imgGray.cols;
    
    int x_min = MAX(0, [box[0] intValue]);
    int x_max = MIN([box[1] intValue], maximum_x);
    int y_min = MAX(0, [box[2] intValue]);
    int y_max = MIN([box[3] intValue], maximum_y);
    
    cv::Mat croppedImage = [RecognizerUtils getCroppedImage:x_max x_min:x_min y_max:y_max y_min:y_min image:imgGray modelHeight:modelHeight];
    
    
    croppedImage = [RecognizerUtils normalizeForRecognizer:croppedImage adjustContrast:0.0];
    NSArray *result;
    if(croppedImage.cols >= largeModelWidth) {
      result = [recognizerLarge runModel:croppedImage];
    } else if (croppedImage.cols >= mediumModelWidth) {
      result = [recognizerMedium runModel: croppedImage];
    } else {
      result = [recognizerSmall runModel: croppedImage];
    }
    
    NSNumber *confidenceScore = [result objectAtIndex:1];
    NSArray *pred_index = [result objectAtIndex:0];
    
    NSArray* decodedTexts = [converter decodeGreedy:pred_index length:(int)(pred_index.count)];
    
    NSDictionary *res = @{@"text": decodedTexts[0], @"bbox": @{@"x1": @((int)((x_min - left) * resizeRatio)), @"x2": @((int)((x_max - left) * resizeRatio)), @"y1": @((int)((y_min - top) * resizeRatio)), @"y2":@((int)((y_max - top) * resizeRatio))}, @"score": confidenceScore};
    [predictions addObject:res];
  }
  
  return predictions;
}

@end

