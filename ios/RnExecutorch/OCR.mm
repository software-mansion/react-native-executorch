#import "OCR.h"
#import "models/object_detection/SSDLiteLargeModel.hpp"
#import <ExecutorchLib/ETModel.h>
#import <React/RCTBridgeModule.h>
#import "utils/ImageProcessor.h"
#import "models/ocr/Detector.h"
#import "models/ocr/RecognitionHandler.h"

@implementation OCR {
  Detector *detector;
  RecognitionHandler *recognitionHandler;
}

RCT_EXPORT_MODULE()

- (void)loadModule:(NSString *)detectorSource
recognizerSource512:(NSString *)recognizerSource512
recognizerSource256:(NSString *)recognizerSource256
recognizerSource128:(NSString *)recognizerSource128
          language:(NSString *)language
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  detector = [[Detector alloc] init];
  recognitionHandler = [[RecognitionHandler alloc] init];
  
  [detector loadModel:[NSURL URLWithString:detectorSource] completion:^(BOOL success, NSNumber *errorCode) {
    if (!success) {
      NSError *error = [NSError errorWithDomain:@"OCRErrorDomain"
                                           code:[errorCode intValue]
                                       userInfo:@{NSLocalizedDescriptionKey: [NSString stringWithFormat:@"%ld", (long)[errorCode longValue]]}];
      reject(@"init_module_error", @"Failed to initialize detector module", error);
      return;
    }
    
    [self->recognitionHandler loadRecognizers:recognizerSource512 mediumRecognizerPath:recognizerSource256 smallRecognizerPath:recognizerSource128 completion:^(BOOL allModelsLoaded, NSNumber *errorCode) {
      if (allModelsLoaded) {
        resolve(@(YES));
      } else {
        NSError *error = [NSError errorWithDomain:@"OCRErrorDomain"
                                             code:[errorCode intValue]
                                         userInfo:@{NSLocalizedDescriptionKey: [NSString stringWithFormat:@"%ld", (long)[errorCode longValue]]}];
        reject(@"init_recognizer_error", @"Failed to initialize one or more recognizer models", error);
      }
    }];
  }];
}

- (void)forward:(NSString *)input
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
  @try {
    cv::Mat image = [ImageProcessor readImage:input];
    NSArray* result = [detector runModel:image];
    cv::Size detectorSize = [detector getModelImageSize];
    cv::cvtColor(image, image, cv::COLOR_BGR2GRAY);
    result = [self->recognitionHandler recognize:result imgGray:image desiredWidth:detectorSize.width desiredHeight:detectorSize.height];
    resolve(result);
  } @catch (NSException *exception) {
    reject(@"forward_error", [NSString stringWithFormat:@"%@", exception.reason],
           nil);
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeOCRSpecJSI>(
                                                             params);
}

@end
