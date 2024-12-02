#import "ETModule.h"
#import "utils/Fetcher.h"
#import <ExecutorchLib/ETModel.h>
#import <React/RCTBridgeModule.h>
#include <string>

@implementation ETModule {
  ETModel *module;
}

RCT_EXPORT_MODULE()

- (void)loadModule:(NSString *)modelSource
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  if (!module) {
    module = [[ETModel alloc] init];
  }

  [Fetcher fetchResource:[NSURL URLWithString:modelSource]
            resourceType:ResourceType::MODEL
       completionHandler:^(NSString *filePath, NSError *error) {
         if (error) {
           reject(@"init_module_error", @"-1", nil);
           return;
         }

         NSNumber *result = [self->module loadModel:filePath];
         if ([result isEqualToNumber:@(0)]) {
           resolve(result);
         } else {
           NSError *error = [NSError
               errorWithDomain:@"ETModuleErrorDomain"
                          code:[result intValue]
                      userInfo:@{
                        NSLocalizedDescriptionKey : [NSString
                            stringWithFormat:@"%ld", (long)[result longValue]]
                      }];

           reject(@"init_module_error", error.localizedDescription, error);
         }
       }];
}

- (void)forward:(NSArray *)input
          shape:(NSArray *)shape
      inputType:(double)inputType
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
  @try {
      NSArray *result = [module forward:input shape:shape inputType:[NSNumber numberWithInt:inputType]];
    resolve(result);
  } @catch (NSException *exception) {
    NSLog(@"An exception occurred: %@, %@", exception.name, exception.reason);
    reject(@"result_error", [NSString stringWithFormat:@"%@", exception.reason],
           nil);
  }
}

- (void)loadMethod:(NSString *)methodName
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  NSNumber *result = [module loadMethod:methodName];
  if ([result intValue] == 0) {
    resolve(result);
    return;
  }
  reject(@"load_method_error", [result stringValue], nil);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeETModuleSpecJSI>(params);
}

@end
