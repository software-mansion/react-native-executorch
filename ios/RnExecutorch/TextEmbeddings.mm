#import "TextEmbeddings.h"
#import "models/text_embeddings/TextEmbeddingsModel.h"

@implementation TextEmbeddings {
  TextEmbeddingsModel *model;
}

RCT_EXPORT_MODULE()

- (void)loadModule:(NSString *)modelSource
   tokenizerSource:(NSString *) tokenizerSource
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  model = [[TextEmbeddingsModel alloc] init];
  
  NSNumber *modelLoadingResult = [model loadModelSync:modelSource];
  if(!modelLoadingResult) {
    reject(@"init_module_error", [NSString stringWithFormat:@"%@", modelLoadingResult], nil);
    return;
  }
  
  if (![model loadTokenizer:tokenizerSource]) {
    reject(@"init_tokenizer_error", [NSString stringWithFormat:@"%@", @33], nil);
    return;
  }
  
  resolve(@0);
}

- (void)forward:(NSString *)input
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
  @try {
    NSArray *result = [model runModel:input];
    resolve(result);
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
  return std::make_shared<facebook::react::NativeTextEmbeddingsSpecJSI>(params);
}

@end
