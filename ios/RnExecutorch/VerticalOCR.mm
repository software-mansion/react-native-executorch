#import "VerticalOCR.h"
#import "models/ocr/Detector.h"
#import "models/ocr/RecognitionHandler.h"
#import "models/ocr/Recognizer.h"
#import "models/ocr/utils/RecognizerUtils.h"
#import "utils/ImageProcessor.h"
#import <ExecutorchLib/ETModel.h>
#import <React/RCTBridgeModule.h>
#import "models/ocr/utils/OCRUtils.h"
#import "models/ocr/utils/CTCLabelConverter.h"

@implementation VerticalOCR {
  Detector *detectorLarge;
  Detector *detectorNarrow;
  Recognizer *recognizer;
  CTCLabelConverter *converter;
  BOOL independentCharacters;
}

RCT_EXPORT_MODULE()

- (void)loadModule:(NSString *)detectorLargeSource
detectorNarrowSource:(NSString *)detectorNarrowSource
  recognizerSource:(NSString *)recognizerSource
           symbols:(NSString *)symbols
independentCharacters:(BOOL)independentCharacters
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  NSLog(@"%@", recognizerSource);
  detectorLarge = [[Detector alloc] initWithIsVertical:YES detectSingleCharacters: NO];
  converter = [[CTCLabelConverter alloc] initWithCharacters:symbols separatorList:@{}];
  self->independentCharacters = independentCharacters;
  [detectorLarge
   loadModel:[NSURL URLWithString:detectorLargeSource]
   completion:^(BOOL success, NSNumber *errorCode) {
    if (!success) {
      reject(@"init_module_error", @"Failed to initialize detector module",
             nil);
      return;
    }
    self->detectorNarrow = [[Detector alloc] initWithIsVertical:YES detectSingleCharacters:YES];
    [self->detectorNarrow
     loadModel:[NSURL URLWithString:detectorNarrowSource]
     completion:^(BOOL success, NSNumber *errorCode) {
      if (!success) {
        reject(@"init_module_error",
                @"Failed to initialize detector module", nil);
        return;
      }
      
      self->recognizer = [[Recognizer alloc] init];
      [self->recognizer
       loadModel:[NSURL URLWithString:recognizerSource]
       completion:^(BOOL success, NSNumber *errorCode) {
        if (!success) {
          reject(@"init_module_error",
                 @"Failed to initialize recognizer module", nil);
        }
        
        resolve(@(YES));
      }];
    }];
  }];
  
}

- (void)forward:(NSString *)input
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
  @try {
    cv::Mat image = [ImageProcessor readImage:input];
    NSArray *result = [detectorLarge runModel:image];
    cv::Mat resizedImage = [OCRUtils resizeWithPadding:image desiredWidth:1280 desiredHeight:1280];
    NSMutableArray *predictions = [NSMutableArray array];
    for (NSDictionary *box in result){
      NSArray *coords = box[@"bbox"];
      const int boxWidth = [[coords objectAtIndex:2] CGPointValue].x - [[coords objectAtIndex:0] CGPointValue].x;
      const int boxHeight = [[coords objectAtIndex:2] CGPointValue].y - [[coords objectAtIndex:0] CGPointValue].y;
      std::vector<cv::Point2f> points;
      for (NSValue *value in coords) {
        const CGPoint point = [value CGPointValue];
        points.emplace_back(static_cast<float>(point.x),
                            static_cast<float>(point.y));
      }
      
      cv::Rect boundingBox = cv::boundingRect(points);
      cv::Mat croppedImage = resizedImage(boundingBox);
      NSDictionary *ratioAndPadding =
          [RecognizerUtils calculateResizeRatioAndPaddings:image.cols
                                                    height:image.rows
                                              desiredWidth:1280
                                             desiredHeight:1280];
      
      NSString *text = @"";
      NSNumber *confidenceScore = @0.0;
      NSArray *detectionResult = [detectorNarrow runModel:croppedImage];
      std::vector<cv::Mat> croppedCharacters;
      for(NSDictionary *bbox in detectionResult){
        NSArray *coords2 = bbox[@"bbox"];
        NSDictionary *paddingsSingle = [RecognizerUtils calculateResizeRatioAndPaddings:boxWidth height:boxHeight desiredWidth:320 desiredHeight:1280];
        cv::Mat croppedCharacter = [RecognizerUtils cropImageWithBoundingBox:image bbox:coords2 originalBbox:coords paddings:paddingsSingle originalPaddings:ratioAndPadding];
        if(self->independentCharacters){
          croppedCharacter = [RecognizerUtils normalizeForRecognizer:croppedCharacter adjustContrast:0.0];
          NSArray *recognitionResult = [recognizer runModel:croppedCharacter];
          NSArray *predIndex = [recognitionResult objectAtIndex:0];
          NSArray *decodedText = [converter decodeGreedy: predIndex length:(int)(predIndex.count)];
          text = [text stringByAppendingString:decodedText[0]];
          confidenceScore = @([confidenceScore floatValue] + [[recognitionResult objectAtIndex:1] floatValue]);
        }else{
          croppedCharacters.push_back(croppedCharacter);
        }
      }
      
      if(self->independentCharacters){
        confidenceScore = @([confidenceScore floatValue] / detectionResult.count);
      }else{
        cv::Mat mergedCharacters;
        cv::hconcat(croppedCharacters.data(), (int)croppedCharacters.size(), mergedCharacters);
        mergedCharacters = [OCRUtils resizeWithPadding:mergedCharacters desiredWidth:512 desiredHeight:64];
        mergedCharacters = [RecognizerUtils normalizeForRecognizer:mergedCharacters adjustContrast:0.0];
        NSArray *recognitionResult = [recognizer runModel:mergedCharacters];
        NSArray *predIndex = [recognitionResult objectAtIndex:0];
        NSArray *decodedText = [converter decodeGreedy: predIndex length:(int)(predIndex.count)];
        text = [text stringByAppendingString:decodedText[0]];
        confidenceScore = @([confidenceScore floatValue] + [[recognitionResult objectAtIndex:1] floatValue]);
      }
      
      NSMutableArray *newCoords = [NSMutableArray arrayWithCapacity:4];
      for (NSValue *coord in coords) {
        const CGPoint point = [coord CGPointValue];
        
        [newCoords addObject:@{
          @"x" : @((point.x - [ratioAndPadding[@"left"] intValue]) * [ratioAndPadding[@"resizeRatio"] floatValue]),
          @"y" : @((point.y - [ratioAndPadding[@"top"] intValue]) * [ratioAndPadding[@"resizeRatio"] floatValue])
        }];
      }
      
      NSDictionary *res = @{
        @"text" : text,
        @"bbox" : newCoords,
        @"score" : confidenceScore
      };
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
