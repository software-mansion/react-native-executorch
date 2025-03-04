#import "RecognitionHandler.h"
#import "../../utils/ImageProcessor.h"
#import "./utils/CTCLabelConverter.h"
#import "./utils/OCRUtils.h"
#import "./utils/RecognizerUtils.h"
#import "./utils/Constants.h"
#import "ExecutorchLib/ETModel.h"
#import "Recognizer.h"
#import <React/RCTBridgeModule.h>

/*
 RecognitionHandler class is responsible for loading and choosing the
 appropriate recognizer model based on the input image size, it also handles
 converting the model output to text.
 */

@implementation RecognitionHandler {
  Recognizer *recognizerLarge;
  Recognizer *recognizerMedium;
  Recognizer *recognizerSmall;
  CTCLabelConverter *converter;
}

- (instancetype)initWithSymbols:(NSString *)symbols {
  self = [super init];
  if (self) {
    recognizerLarge = [[Recognizer alloc] init];
    recognizerMedium = [[Recognizer alloc] init];
    recognizerSmall = [[Recognizer alloc] init];

    converter = [[CTCLabelConverter alloc]
        initWithCharacters:symbols
                 separatorList:@{}];
  }
  return self;
}

- (void)loadRecognizers:(NSString *)largeRecognizerPath
    mediumRecognizerPath:(NSString *)mediumRecognizerPath
     smallRecognizerPath:(NSString *)smallRecognizerPath
              completion:(void (^)(BOOL, NSNumber *))completion {
  dispatch_group_t group = dispatch_group_create();
  __block BOOL allSuccessful = YES;

  NSArray<Recognizer *> *recognizers =
      @[ recognizerLarge, recognizerMedium, recognizerSmall ];
  NSArray<NSString *> *paths =
      @[ largeRecognizerPath, mediumRecognizerPath, smallRecognizerPath ];

  for (NSInteger i = 0; i < recognizers.count; i++) {
    Recognizer *recognizer = recognizers[i];
    NSString *path = paths[i];

    dispatch_group_enter(group);
    [recognizer loadModel:[NSURL URLWithString:path]
               completion:^(BOOL success, NSNumber *errorCode) {
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

- (NSArray *)runModel:(cv::Mat)croppedImage {
  NSArray *result;
  if (croppedImage.cols >= largeRecognizerWidth) {
    result = [recognizerLarge runModel:croppedImage];
  } else if (croppedImage.cols >= mediumRecognizerWidth) {
    result = [recognizerMedium runModel:croppedImage];
  } else {
    result = [recognizerSmall runModel:croppedImage];
  }

  return result;
}

- (NSArray *)recognize:(NSArray<NSDictionary *> *)bBoxesList
               imgGray:(cv::Mat)imgGray
          desiredWidth:(int)desiredWidth
         desiredHeight:(int)desiredHeight {
  NSDictionary *ratioAndPadding =
      [RecognizerUtils calculateResizeRatioAndPaddings:imgGray.cols
                                                height:imgGray.rows
                                          desiredWidth:desiredWidth
                                         desiredHeight:desiredHeight];
  const int left = [ratioAndPadding[@"left"] intValue];
  const int top = [ratioAndPadding[@"top"] intValue];
  const CGFloat resizeRatio = [ratioAndPadding[@"resizeRatio"] floatValue];
  imgGray = [OCRUtils resizeWithPadding:imgGray
                           desiredWidth:desiredWidth
                          desiredHeight:desiredHeight];

  NSMutableArray *predictions = [NSMutableArray array];
  for (NSDictionary *box in bBoxesList) {
    cv::Mat croppedImage = [RecognizerUtils getCroppedImage:box
                                                      image:imgGray
                                                modelHeight:recognizerHeight];
    if (croppedImage.empty()) {
      continue;
    }
    croppedImage = [RecognizerUtils normalizeForRecognizer:croppedImage
                                            adjustContrast:adjustContrast isVertical:NO];
    NSArray *result = [self runModel:croppedImage];

    NSNumber *confidenceScore = [result objectAtIndex:1];
    if ([confidenceScore floatValue] < lowConfidenceThreshold) {
      cv::rotate(croppedImage, croppedImage, cv::ROTATE_180);

      NSArray *rotatedResult = [self runModel:croppedImage];
      NSNumber *rotatedConfidenceScore = [rotatedResult objectAtIndex:1];

      if ([rotatedConfidenceScore floatValue] > [confidenceScore floatValue]) {
        result = rotatedResult;
        confidenceScore = rotatedConfidenceScore;
      }
    }

    NSArray *predIndex = [result objectAtIndex:0];
    NSArray *decodedTexts = [converter decodeGreedy:predIndex
                                             length:(int)(predIndex.count)];

    NSMutableArray *bbox = [NSMutableArray arrayWithCapacity:4];
    for (NSValue *coords in box[@"bbox"]) {
      const CGPoint point = [coords CGPointValue];
      [bbox addObject:@{
        @"x" : @((point.x - left) * resizeRatio),
        @"y" : @((point.y - top) * resizeRatio)
      }];
    }

    NSDictionary *res = @{
      @"text" : decodedTexts[0],
      @"bbox" : bbox,
      @"score" : confidenceScore
    };
    [predictions addObject:res];
  }

  return predictions;
}

@end
