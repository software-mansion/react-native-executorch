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
  @try {
    resolve([tokenizer encode:input]);
  } @catch (NSException *exception) {
    reject(@"tokenizer_error",
           [NSString stringWithFormat:@"%@", exception.reason], nil);
  }
}

- (void)decode:(NSArray *)input
       resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject {
  @try {
    resolve([tokenizer decode:input]);
  } @catch (NSException *exception) {
    reject(@"tokenizer_error",
           [NSString stringWithFormat:@"%@", exception.reason], nil);
  }
}

- (void)getVocabSize:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
  @try {
    resolve([NSNumber numberWithUnsignedInteger:[tokenizer getVocabSize]]);
  } @catch (NSException *exception) {
    reject(@"tokenizer_error",
           [NSString stringWithFormat:@"%@", exception.reason], nil);
  }
}

- (void)idToToken:(double)input
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject {
  @try {
    NSInteger tokenID = (NSInteger)input;
    resolve([tokenizer idToToken:tokenID]);
  } @catch (NSException *exception) {
    reject(@"tokenizer_error",
           [NSString stringWithFormat:@"%@", exception.reason], nil);
  }
}

- (void)tokenToId:(NSString *)input
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject {
  @try {
    resolve([NSNumber numberWithInteger:[tokenizer tokenToId:input]]);
  } @catch (NSException *exception) {
    reject(@"tokenizer_error",
           [NSString stringWithFormat:@"%@", exception.reason], nil);
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeTokenizerSpecJSI>(params);
}

@end
