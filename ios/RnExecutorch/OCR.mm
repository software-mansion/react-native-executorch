#import "OCR.h"
#import "models/ocr/Detector.h"
#import "models/ocr/RecognitionHandler.h"
#import "models/ocr/utils/Constants.h"
#import "utils/ImageProcessor.h"
#import <ExecutorchLib/ETModel.h>
#import <React/RCTBridgeModule.h>

@implementation OCR {
  Detector *detector;
  RecognitionHandler *recognitionHandler;
}

RCT_EXPORT_MODULE()

- (void)loadModule:(NSString *)detectorSource
     recognizerSourceLarge:(NSString *)recognizerSourceLarge
    recognizerSourceMedium:(NSString *)recognizerSourceMedium
     recognizerSourceSmall:(NSString *)recognizerSourceSmall
                   symbols:(NSString *)symbols
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject {
  detector = [[Detector alloc] init];
  [detector
       loadModel:[NSURL URLWithString:detectorSource]
      completion:^(BOOL success, NSNumber *errorCode) {
        if (!success) {
          NSError *error = [NSError
              errorWithDomain:@"OCRErrorDomain"
                         code:[errorCode intValue]
                     userInfo:@{
                       NSLocalizedDescriptionKey : [NSString
                           stringWithFormat:@"%ld", (long)[errorCode longValue]]
                     }];
          reject(@"init_module_error", @"Failed to initialize detector module",
                 error);
          return;
        }
        self->recognitionHandler =
            [[RecognitionHandler alloc] initWithSymbols:symbols];
        [self->recognitionHandler
                 loadRecognizers:recognizerSourceLarge
            mediumRecognizerPath:recognizerSourceMedium
             smallRecognizerPath:recognizerSourceSmall
                      completion:^(BOOL allModelsLoaded, NSNumber *errorCode) {
                        if (allModelsLoaded) {
                          resolve(@(YES));
                        } else {
                          NSError *error = [NSError
                              errorWithDomain:@"OCRErrorDomain"
                                         code:[errorCode intValue]
                                     userInfo:@{
                                       NSLocalizedDescriptionKey : [NSString
                                           stringWithFormat:@"%ld",
                                                            (long)[errorCode
                                                                longValue]]
                                     }];
                          reject(@"init_recognizer_error",
                                 @"Failed to initialize one or more "
                                 @"recognizer models",
                                 error);
                        }
                      }];
      }];
}

- (void)forward:(NSString *)input
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
  /*
   The OCR consists of two phases:
   1. Detection - detecting text regions in the image, the result of this phase
   is a list of bounding boxes.
   2. Recognition - recognizing the text in the bounding boxes, the result is a
   list of strings and corresponding confidence scores.

   Recognition uses three models, each model is resposible for recognizing text
   of different sizes (e.g. large - 512x64, medium - 256x64, small - 128x64).
   */
  @try {
    cv::Mat image = [ImageProcessor readImage:input];
    NSArray *result = [detector runModel:image];
    cv::cvtColor(image, image, cv::COLOR_BGR2GRAY);
    result = [self->recognitionHandler recognize:result
                                         imgGray:image
                                    desiredWidth:recognizerImageSize
                                   desiredHeight:recognizerImageSize];
    resolve(result);
  } @catch (NSException *exception) {
    NSLog(@"%@", exception.reason);
    reject(@"forward_error",
           [NSString stringWithFormat:@"%@", exception.reason], nil);
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeOCRSpecJSI>(params);
}

@end
