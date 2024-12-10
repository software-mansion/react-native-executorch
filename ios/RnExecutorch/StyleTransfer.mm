#import "StyleTransfer.h"
#import "utils/Fetcher.h"
#import "models/BaseModel.h"
#import <ExecutorchLib/ETModel.h>
#import <React/RCTBridgeModule.h>
#import "models/StyleTransferModel.h"
#import <opencv2/opencv.hpp>
#include <string>

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
    NSURL *url = [NSURL URLWithString:input];
    NSData *data = [NSData dataWithContentsOfURL:url];
    if (!data) {
      reject(@"img_loading_error", @"Unable to load image data", nil);
      return;
    }
    
    cv::Mat decodedImage = cv::imdecode(cv::Mat(1, [data length], CV_8UC1, (void*)data.bytes), cv::IMREAD_COLOR);
    
    cv::Mat resultImage = [model runModel:decodedImage];
    
    NSString *outputPath = [NSTemporaryDirectory() stringByAppendingPathComponent:[@"rn_executorch" stringByAppendingString:@".png"]];
    
    std::string filePath = [outputPath UTF8String];
    cv::imwrite(filePath, resultImage);
    resolve(outputPath);
    return;
  } @catch (NSException *exception) {
    NSLog(@"An exception occurred: %@, %@", exception.name, exception.reason);
    reject(@"result_error", [NSString stringWithFormat:@"%@", exception.reason],
           nil);
  }
}


- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeStyleTransferSpecJSI>(params);
}

@end
