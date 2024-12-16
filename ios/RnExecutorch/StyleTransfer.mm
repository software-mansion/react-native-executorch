#import "StyleTransfer.h"
#import "utils/Fetcher.h"
#import "models/BaseModel.h"
#import "utils/ETError.h"
#import "ImageProcessor.h"
#import <ExecutorchLib/ETModel.h>
#import <React/RCTBridgeModule.h>
#import "models/StyleTransferModel.h"
#import <opencv2/opencv.hpp>

@implementation StyleTransfer {
  StyleTransferModel* model;
}

RCT_EXPORT_MODULE()

- (void)loadModule:(NSString *)modelSource
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  model = [[StyleTransferModel alloc] init];
  [model loadModel: [NSURL URLWithString:modelSource] completion:^(BOOL success, NSNumber *errorCode){
    if(success){
      resolve(errorCode);
      return;
    }
    
    reject(@"init_module_error", [NSString
                                  stringWithFormat:@"%ld", (long)[errorCode longValue]], nil);
    return;
  }];
}

- (void)forward:(NSString *)input
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
  @try {
    cv::Mat image = [ImageProcessor readImage:input];
    cv::Mat resultImage = [model runModel:image];
    
    NSString* tempFilePath = [ImageProcessor saveToTempFile:resultImage];
    resolve(tempFilePath);
    return;
  } @catch (NSException *exception) {
    NSLog(@"An exception occurred: %@, %@", exception.name, exception.reason);
    reject(@"forward_error", [NSString stringWithFormat:@"%@", exception.reason],
           nil);
    return;
  }
}


- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeStyleTransferSpecJSI>(params);
}

@end
