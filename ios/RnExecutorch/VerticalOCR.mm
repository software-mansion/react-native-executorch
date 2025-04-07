#import "VerticalOCR.h"
#import "models/ocr/Recognizer.h"
#import "models/ocr/VerticalDetector.h"
#import "models/ocr/utils/CTCLabelConverter.h"
#import "models/ocr/utils/Constants.h"
#import "models/ocr/utils/OCRUtils.h"
#import "models/ocr/utils/RecognizerUtils.h"
#import "utils/ImageProcessor.h"

@implementation VerticalOCR {
  VerticalDetector *detectorLarge;
  VerticalDetector *detectorNarrow;
  Recognizer *recognizer;
  CTCLabelConverter *converter;
  BOOL independentCharacters;
}

RCT_EXPORT_MODULE()

- (void)releaseResources {
  detectorLarge = nil;
  detectorNarrow = nil;
  recognizer = nil;
  converter = nil;
}

- (void)loadModule:(NSString *)detectorLargeSource
     detectorNarrowSource:(NSString *)detectorNarrowSource
         recognizerSource:(NSString *)recognizerSource
                  symbols:(NSString *)symbols
    independentCharacters:(BOOL)independentCharacters
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject {
  converter = [[CTCLabelConverter alloc] initWithCharacters:symbols
                                              separatorList:@{}];
  self->independentCharacters = independentCharacters;

  detectorLarge = [[VerticalDetector alloc] initWithDetectSingleCharacters:NO];
  NSNumber *errorCode =
      [detectorLarge loadModel:[NSURL URLWithString:detectorLargeSource].path];
  if ([errorCode intValue] != 0) {
    [self releaseResources];
    reject(@"init_module_error", @"Failed to initialize detector module", nil);
    return;
  }

  detectorNarrow =
      [[VerticalDetector alloc] initWithDetectSingleCharacters:YES];
  errorCode = [detectorNarrow
      loadModel:[NSURL URLWithString:detectorNarrowSource].path];
  if ([errorCode intValue] != 0) {
    [self releaseResources];
    reject(@"init_module_error", @"Failed to initialize detector module", nil);
    return;
  }

  recognizer = [[Recognizer alloc] init];
  errorCode =
      [recognizer loadModel:[NSURL URLWithString:recognizerSource].path];
  if ([errorCode intValue] != 0) {
    [self releaseResources];
    reject(@"init_module_error", @"Failed to initialize recognizer module",
           nil);
    return;
  }

  resolve(@0);
}

- (void)forward:(NSString *)input
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
  @try {
    cv::Mat image = [ImageProcessor readImage:input];
    NSArray *result = [detectorLarge runModel:image];
    cv::Size largeDetectorSize = [detectorLarge getModelImageSize];
    cv::Mat resizedImage =
        [OCRUtils resizeWithPadding:image
                       desiredWidth:largeDetectorSize.width
                      desiredHeight:largeDetectorSize.height];
    NSMutableArray *predictions = [NSMutableArray array];

    for (NSDictionary *box in result) {
      NSArray *cords = box[@"bbox"];
      const int boxWidth = [[cords objectAtIndex:2] CGPointValue].x -
                           [[cords objectAtIndex:0] CGPointValue].x;
      const int boxHeight = [[cords objectAtIndex:2] CGPointValue].y -
                            [[cords objectAtIndex:0] CGPointValue].y;

      cv::Rect boundingBox = [OCRUtils extractBoundingBox:cords];
      cv::Mat croppedImage = resizedImage(boundingBox);
      NSDictionary *paddings = [RecognizerUtils
          calculateResizeRatioAndPaddings:image.cols
                                   height:image.rows
                             desiredWidth:largeDetectorSize.width
                            desiredHeight:largeDetectorSize.height];

      NSString *text = @"";
      NSNumber *confidenceScore = @0.0;
      NSArray *boxResult = [detectorNarrow runModel:croppedImage];
      std::vector<cv::Mat> croppedCharacters;
      cv::Size narrowRecognizerSize = [detectorNarrow getModelImageSize];
      for (NSDictionary *characterBox in boxResult) {
        NSArray *boxCords = characterBox[@"bbox"];
        NSDictionary *paddingsBox = [RecognizerUtils
            calculateResizeRatioAndPaddings:boxWidth
                                     height:boxHeight
                               desiredWidth:narrowRecognizerSize.width
                              desiredHeight:narrowRecognizerSize.height];
        cv::Mat croppedCharacter =
            [RecognizerUtils cropImageWithBoundingBox:image
                                                 bbox:boxCords
                                         originalBbox:cords
                                             paddings:paddingsBox
                                     originalPaddings:paddings];
        if (self->independentCharacters) {
          croppedCharacter =
              [RecognizerUtils cropSingleCharacter:croppedCharacter];
          croppedCharacter =
              [RecognizerUtils normalizeForRecognizer:croppedCharacter
                                       adjustContrast:0.0
                                           isVertical:YES];
          NSArray *recognitionResult = [recognizer runModel:croppedCharacter];
          NSArray *predIndex = [recognitionResult objectAtIndex:0];
          NSArray *decodedText =
              [converter decodeGreedy:predIndex length:(int)(predIndex.count)];
          text = [text stringByAppendingString:decodedText[0]];
          confidenceScore = @([confidenceScore floatValue] +
                              [[recognitionResult objectAtIndex:1] floatValue]);
        } else {
          croppedCharacters.push_back(croppedCharacter);
        }
      }

      if (self->independentCharacters) {
        confidenceScore = @([confidenceScore floatValue] / boxResult.count);
      } else {
        cv::Mat mergedCharacters;
        cv::hconcat(croppedCharacters.data(), (int)croppedCharacters.size(),
                    mergedCharacters);
        mergedCharacters = [OCRUtils resizeWithPadding:mergedCharacters
                                          desiredWidth:largeRecognizerWidth
                                         desiredHeight:recognizerHeight];
        mergedCharacters =
            [RecognizerUtils normalizeForRecognizer:mergedCharacters
                                     adjustContrast:0.0
                                         isVertical:NO];
        NSArray *recognitionResult = [recognizer runModel:mergedCharacters];
        NSArray *predIndex = [recognitionResult objectAtIndex:0];
        NSArray *decodedText = [converter decodeGreedy:predIndex
                                                length:(int)(predIndex.count)];
        text = [text stringByAppendingString:decodedText[0]];
        confidenceScore = @([confidenceScore floatValue] +
                            [[recognitionResult objectAtIndex:1] floatValue]);
      }

      NSMutableArray *newCoords = [NSMutableArray arrayWithCapacity:4];
      for (NSValue *cord in cords) {
        const CGPoint point = [cord CGPointValue];

        [newCoords addObject:@{
          @"x" : @((point.x - [paddings[@"left"] intValue]) *
                   [paddings[@"resizeRatio"] floatValue]),
          @"y" : @((point.y - [paddings[@"top"] intValue]) *
                   [paddings[@"resizeRatio"] floatValue])
        }];
      }

      NSDictionary *res =
          @{@"text" : text, @"bbox" : newCoords, @"score" : confidenceScore};
      [predictions addObject:res];
    }

    resolve(predictions);
  } @catch (NSException *exception) {
    reject(@"forward_error",
           [NSString stringWithFormat:@"%@", exception.reason], nil);
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeVerticalOCRSpecJSI>(params);
}

@end
