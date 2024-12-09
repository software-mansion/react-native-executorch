#import "StyleTransfer.h"
#import "utils/Fetcher.h"
#import "models/BaseModel.h"
#import <ExecutorchLib/ETModel.h>
#import <React/RCTBridgeModule.h>
#import "models/StyleTransferModel.h"
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

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeStyleTransferSpecJSI>(params);
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
    UIImage *inputImage = [UIImage imageWithData:data];
    
    UIImage* result = [model runModel:inputImage];
    
    // save img to tmp dir, return URI
    NSString *outputPath = [NSTemporaryDirectory() stringByAppendingPathComponent:[@"test" stringByAppendingString:@".png"]];
    if ([UIImagePNGRepresentation(result) writeToFile:outputPath atomically:YES]) {
      NSURL *fileURL = [NSURL fileURLWithPath:outputPath];
      resolve([fileURL absoluteString]);
    } else {
      reject(@"img_write_error", @"Failed to write processed image to file", nil);
    }
    
  } @catch (NSException *exception) {
    NSLog(@"An exception occurred: %@, %@", exception.name, exception.reason);
    reject(@"result_error", [NSString stringWithFormat:@"%@", exception.reason],
           nil);
  }
}

@end
