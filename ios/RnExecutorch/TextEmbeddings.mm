#import "TextEmbeddings.h"
#import "models/text_embeddings/TextEmbeddingsModel.h"

@implementation TextEmbeddings {
  TextEmbeddingsModel *model;
}

RCT_EXPORT_MODULE()

- (void)loadModule:(NSString *)modelSource
    tokenizerSource:(NSString *)tokenizerSource
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject {
  model = [[TextEmbeddingsModel alloc] init];
  [model loadModel:[NSURL URLWithString:modelSource]
        completion:^(BOOL success, NSNumber *errorCode) {
          if (success) {
            @try {
              [self->model loadTokenizer:tokenizerSource];
              resolve(@0);
            } @catch (NSException *exception) {
              reject(@"Tokenizer_Error", @"Failed to load tokenizer", nil);
            }
          } else {
            reject(
                @"init_module_error",
                [NSString stringWithFormat:@"%ld", (long)[errorCode longValue]],
                nil);
          }
        }];
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
