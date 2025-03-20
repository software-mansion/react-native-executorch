#import "Tokenizer.h"
#import <ExecutorchLib/HuggingFaceTokenizer.h>
#import <React/RCTBridgeModule.h>

@implementation Tokenizer {
  HuggingFaceTokenizer *tokenizer;
}

RCT_EXPORT_MODULE()

- (void)loadModule:(NSString *)modelSource
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  tokenizer = [[HuggingFaceTokenizer alloc] init];
  [tokenizer loadTokenizer:[NSURL URLWithString:modelSource].path];

  resolve(@(0));
}

- (void)encode:(NSString *)input
       resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject {
  resolve([tokenizer encode:input]);
}

- (void)decode:(NSArray *)input
       resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject {
  resolve([tokenizer decode:input]);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeTokenizerSpecJSI>(params);
}

@end
