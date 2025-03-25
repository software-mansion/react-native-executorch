#import "Tokenizer.h"
#import <ExecutorchLib/HuggingFaceTokenizer.h>
#import <React/RCTBridgeModule.h>

@implementation Tokenizer {
  HuggingFaceTokenizer *tokenizer;
}

RCT_EXPORT_MODULE()

- (void)load:(NSString *)tokenizerSource
     resolve:(RCTPromiseResolveBlock)resolve
      reject:(RCTPromiseRejectBlock)reject {
  @try {
    tokenizer = [[HuggingFaceTokenizer alloc]
        initWithTokenizerPath:[NSURL URLWithString:tokenizerSource].path];
    resolve(@(0));
  } @catch (NSException *exception) {
    reject(@"Tokenizer_Error", @"Failed to load tokenizer", nil);
  }
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

- (void)getVocabSize:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
  resolve([NSNumber numberWithUnsignedInteger:[tokenizer getVocabSize]]);
}

- (void)idToToken:(double)input
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject {
  NSInteger tokenID = (NSInteger)input;
  resolve([tokenizer idToToken:tokenID]);
}

- (void)tokenToId:(NSString *)input
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject {
  resolve([NSNumber numberWithInteger:[tokenizer tokenToId:input]]);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeTokenizerSpecJSI>(params);
}

@end
