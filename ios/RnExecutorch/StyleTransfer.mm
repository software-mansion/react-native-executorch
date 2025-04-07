#import "StyleTransfer.h"
#import "ImageProcessor.h"
#import "models/style_transfer/StyleTransferModel.h"

@implementation StyleTransfer {
  StyleTransferModel *model;
}

RCT_EXPORT_MODULE()

- (void)releaseResources {
  model = nil;
}

- (void)loadModule:(NSString *)modelSource
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  model = [[StyleTransferModel alloc] init];

  NSNumber *errorCode =
      [model loadModel:[NSURL URLWithString:modelSource].path];
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
    cv::Mat resultImage = [model runModel:image];

    NSString *tempFilePath = [ImageProcessor saveToTempFile:resultImage];
    resolve(tempFilePath);
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
  return std::make_shared<facebook::react::NativeStyleTransferSpecJSI>(params);
}

@end
