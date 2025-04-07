#import "TextEmbeddings.h"
#import "models/text_embeddings/TextEmbeddingsModel.h"

@implementation TextEmbeddings {
  TextEmbeddingsModel *model;
}

RCT_EXPORT_MODULE()

- (void)releaseResources {
  model = nil;
}

- (void)loadModule:(NSString *)modelSource
    tokenizerSource:(NSString *)tokenizerSource
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject {
  model = [[TextEmbeddingsModel alloc] init];

  @try {
    [self->model loadTokenizer:tokenizerSource];
  } @catch (NSException *exception) {
    [self releaseResources];
    reject(@"Tokenizer_Error",
           [NSString stringWithFormat:@"Failed to load tokenizer from: %@",
                                      tokenizerSource],
           nil);
    return;
  }

  NSNumber *errorCode =
      [model loadModel:[NSURL URLWithString:modelSource].path];
  if ([errorCode intValue] != 0) {
    [self releaseResources];
    reject(@"init_module_error",
           [NSString stringWithFormat:@"%ld", (long)[errorCode longValue]],
           nil);
    return;
  }

  resolve(@0);
}

- (void)forward:(NSString *)input
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
  @try {
    resolve([model runModel:input]);
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
