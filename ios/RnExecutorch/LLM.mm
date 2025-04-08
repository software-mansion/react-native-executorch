#import "LLM.h"
#import <ExecutorchLib/LLaMARunner.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/RCTTurboModule.h>
#import <UIKit/UIKit.h>
#import <react/renderer/uimanager/primitives.h>
#import <string>

@implementation LLM {
  LLaMARunner *runner;
}

- (instancetype)init {
  self = [super init];

  return self;
}

RCT_EXPORT_MODULE()

- (void)onResult:(NSString *)token prompt:(NSString *)prompt {
  if ([token isEqualToString:prompt]) {
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    [self emitOnToken:token];
  });
}

- (void)loadLLM:(NSString *)modelSource
    tokenizerSource:(NSString *)tokenizerSource
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject {
  NSURL *modelURL = [NSURL URLWithString:modelSource];
  NSURL *tokenizerURL = [NSURL URLWithString:tokenizerSource];
  @try {
    self->runner = [[LLaMARunner alloc] initWithModelPath:modelURL.path
                                            tokenizerPath:tokenizerURL.path];

    resolve(@"Model and tokenizer loaded successfully");
    return;
  } @catch (NSException *exception) {
    reject(@"Model or tokenizer loading failed", exception.reason, nil);
    return;
  }
}

- (void)runInference:(NSString *)input
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {

  dispatch_async(
      dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSError *error = nil;
        [self->runner generate:input
             withTokenCallback:^(NSString *token) {
               [self onResult:token prompt:input];
             }
                         error:&error];

        if (error) {
          reject(@"error_in_generation", error.localizedDescription, nil);
          return;
        }
        resolve(@"Inference completed successfully");
        return;
      });
}

- (void)interrupt {
  [self->runner stop];
}

- (void)deleteModule {
  self->runner = nil;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeLLMSpecJSI>(params);
}

@end
