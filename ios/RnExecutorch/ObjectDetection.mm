#import "ObjectDetection.h"
#import "models/object_detection/SSDLiteLargeModel.hpp"
#import <ExecutorchLib/ETModel.h>
#import <React/RCTBridgeModule.h>
#import "utils/ImageProcessor.h"

@implementation ObjectDetection {
  SSDLiteLargeModel *model;
}

RCT_EXPORT_MODULE()

- (void)loadModule:(NSString *)modelSource
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  model = [[SSDLiteLargeModel alloc] init];
  [model loadModel:[NSURL URLWithString:modelSource]
        completion:^(BOOL success, NSNumber *errorCode) {
          if (success) {
            resolve(errorCode);
            return;
          }

          NSError *error = [NSError
              errorWithDomain:@"StyleTransferErrorDomain"
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
    NSArray *result = [model runModel:image];
    resolve(result);
  } @catch (NSException *exception) {
    reject(@"forward_error", [NSString stringWithFormat:@"%@", exception.reason],
           nil);
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeObjectDetectionSpecJSI>(
      params);
}

@end
