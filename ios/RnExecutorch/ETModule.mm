#import "ETModule.h"
#import <ExecutorchLib/ETModel.h>

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
  NSURL *modelURL = [NSURL URLWithString:modelSource];
  NSNumber *result = [self->module loadModel:modelURL.path];

  if ([result intValue] != 0) {
    NSError *error =
        [NSError errorWithDomain:@"ETModuleErrorDomain"
                            code:[result intValue]
                        userInfo:@{
                          NSLocalizedDescriptionKey : [NSString
                              stringWithFormat:@"%ld", (long)[result longValue]]
                        }];

    reject(@"init_module_error", error.localizedDescription, error);
    return;
  }

  resolve(result);
}

- (void)forward:(NSArray *)inputs
         shapes:(NSArray *)shapes
     inputTypes:(NSArray *)inputTypes
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
  @try {
    NSArray *result = [module forward:inputs
                               shapes:shapes
                           inputTypes:inputTypes];
    resolve(result);
  } @catch (NSException *exception) {
    NSLog(@"An exception occurred in forward: %@, %@", exception.name,
          exception.reason);
    reject(
        @"forward_error",
        [NSString stringWithFormat:@"An error occurred: %@", exception.reason],
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
