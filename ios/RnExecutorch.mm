#import "RnExecutorch.h"
#import <LLaMARunner/LLaMARunner.h>
#import "utils/ConversationManager.h"
#import "utils/Constants.h"
#import "utils/Fetcher.h"
#import "utils/LargeFileFetcher.h"
#import <UIKit/UIKit.h>
#import <string>

@implementation RnExecutorch {
  LLaMARunner *runner;
  BOOL hasListeners;
  ConversationManager *conversationManager;
  NSMutableString *tempLlamaResponse;
  BOOL isFetching;
}

- (instancetype)init {
  self = [super init];
  if(self) {
    isFetching = NO;
    tempLlamaResponse = [[NSMutableString alloc] init];
  }

  return self;
}

RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onToken", @"onDownloadProgress"];
}

- (void)startObserving {
  hasListeners = YES;
}

- (void)stopObserving {
  hasListeners = NO;
}

- (void)onResult:(NSString *)token prompt:(NSString *)prompt {
  if (!self->hasListeners || [token isEqualToString:prompt]) {
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    [self sendEventWithName:@"onToken" body:token];
    [self->tempLlamaResponse appendString:token];
  });
}

- (void)updateDownloadProgress:(NSNumber *)progress {
  if (!self->hasListeners){
    return;
  }
  
  dispatch_async(dispatch_get_main_queue(), ^{
    [self sendEventWithName:@"onDownloadProgress" body:progress];
  });
}

RCT_EXPORT_METHOD(loadLLM: (NSString *)modelSource
                  tokenizerSource:(NSString *)tokenizerSource
                  systemPrompt:(nonnull NSString *)systemPrompt
                  contextWindowLength:(nonnull NSNumber *)contextWindowLength
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  NSURL *modelURL = [NSURL URLWithString:modelSource];
  NSURL *tokenizerURL = [NSURL URLWithString:tokenizerSource];
    
  if(self->runner || isFetching){
    reject(@"model_already_loaded", @"Model and tokenizer already loaded", nil);
    return;
  }
  
  isFetching = YES;
  [Fetcher fetchResource:tokenizerURL resourceType:ResourceType::TOKENIZER completionHandler:^(NSString *tokenizerFilePath, NSError *error) {
    if(error){
      reject(@"download_error", error.localizedDescription, nil);
      return;
    }
    LargeFileFetcher *modelFetcher = [[LargeFileFetcher alloc] init];
    modelFetcher.onProgress = ^(NSNumber *progress) {
      [self updateDownloadProgress:progress];
    };
    
    modelFetcher.onFailure = ^(NSError *error){
      reject(@"download_error", error.localizedDescription, nil);
      return;
    };
    
    modelFetcher.onFinish = ^(NSString *modelFilePath) {
      self->runner = [[LLaMARunner alloc] initWithModelPath:modelFilePath tokenizerPath:tokenizerFilePath];
      NSUInteger contextWindowLengthUInt = [contextWindowLength unsignedIntegerValue];
      
      self->conversationManager = [[ConversationManager alloc] initWithNumMessagesContextWindow: contextWindowLengthUInt systemPrompt: systemPrompt];
      self->isFetching = NO;
      resolve(@"Model and tokenizer loaded successfully");
      return;
    };
    
    [modelFetcher startDownloadingFileFromURL:modelURL];
  }];
}

RCT_EXPORT_METHOD(runInference:(NSString *)input resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  [conversationManager addResponse:input senderRole:ChatRole::USER];
  NSString *prompt = [conversationManager getConversation];

  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      NSError *error = nil;
      [self->runner generate:prompt withTokenCallback:^(NSString *token) {
          [self onResult:token prompt:prompt];
      } error:&error];

      // make sure to add eot token once generation is done
      if (![self->tempLlamaResponse hasSuffix:END_OF_TEXT_TOKEN_NS]) {
        [self onResult:END_OF_TEXT_TOKEN_NS prompt:prompt];
      }

      if (self->tempLlamaResponse) {
        [self->conversationManager addResponse:self->tempLlamaResponse senderRole:ChatRole::ASSISTANT];
        self->tempLlamaResponse = [NSMutableString string];
      }

      if (error) {
          reject(@"error_in_generation", error.localizedDescription, nil);
          return;
      }
      resolve(@"Inference completed successfully");
      return;
  });
}


RCT_EXPORT_METHOD(interrupt) {
  [self->runner stop];
}

RCT_EXPORT_METHOD(deleteModule) {
  self->runner = nil;
}

@end
