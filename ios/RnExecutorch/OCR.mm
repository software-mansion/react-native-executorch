#import "OCR.h"
#import "models/object_detection/SSDLiteLargeModel.hpp"
#import <ExecutorchLib/ETModel.h>
#import <React/RCTBridgeModule.h>
#import "utils/ImageProcessor.h"
#import "models/ocr/Detector.h"
#import "models/ocr/RecognitionHandler.h"

@implementation OCR {
  Detector *detector;
  RecognitionHandler *handler;
}

RCT_EXPORT_MODULE()

- (void)loadModule:(NSString *)detectorSource
 recognizerSources:(NSArray *)recognizerSources
          language:(NSString *)language
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  detector = [[Detector alloc] init];
  [detector loadModel:[NSURL URLWithString:detectorSource]
           completion:^(BOOL success, NSNumber *errorCode) {
    if (success) {
      resolve(errorCode);
      return;
    }
    
    NSError *error = [NSError
                      errorWithDomain:@"OCRErrorDomain"
                      code:[errorCode intValue]
                      userInfo:@{
      NSLocalizedDescriptionKey : [NSString
                                   stringWithFormat:@"%ld", (long)[errorCode longValue]]
    }];
    reject(@"init_module_error", error.localizedDescription, error);
    return;
  }];
}

- (void)forward:(NSString *)input
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
  @try {
    cv::Mat image = [ImageProcessor readImage:input];
    NSArray* result = [detector runModel:image];
    cv::cvtColor(image, image, cv::COLOR_BGR2GRAY);
    handler = [[RecognitionHandler alloc] init];
    result = [handler recognize:result imgGray:image desiredWidth:1280 desiredHeight:1280];
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
