#import "OCR.h"
#import "models/object_detection/SSDLiteLargeModel.hpp"
#import <ExecutorchLib/ETModel.h>
#import <React/RCTBridgeModule.h>
#import "utils/ImageProcessor.h"
#import "models/ocr/Detector.h"

@implementation OCR {
  Detector *detector;
}

RCT_EXPORT_MODULE()

- (void)loadModule:(NSString *)detectorSource
 recognizerSources:(NSArray *)recognizerSources
          language:(NSString *)language
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  NSLog(@"TEST");
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
