#import "Classification.h"
#import "ImageProcessor.h"
#import "models/classification/ClassificationModel.h"

@implementation Classification {
  ClassificationModel *model;
}

RCT_EXPORT_MODULE()

- (void)releaseResources {
  model = nil;
}

- (void)loadModule:(NSString *)modelSource
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  model = [[ClassificationModel alloc] init];

  NSNumber *errorCode = [model loadModel:modelSource];
  if ([errorCode intValue] != 0) {
    [self releaseResources];
    reject(@"init_module_error",
           [NSString stringWithFormat:@"%ld", (long)[errorCode longValue]],
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
    NSDictionary *result = [model runModel:image];

    resolve(result);
    return;
  } @catch (NSException *exception) {
    NSLog(@"An exception occurred: %@, %@", exception.name, exception.reason);
    reject(@"forward_error",
           [NSString stringWithFormat:@"%@", exception.reason], nil);
    return;
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeClassificationSpecJSI>(params);
}

@end
