#import "LLM.h"
#import <ExecutorchLib/LLaMARunner.h>
#import "utils/llms/ConversationManager.h"
#import "utils/llms/Constants.h"
#import "utils/Fetcher.h"
#import "utils/LargeFileFetcher.h"
#import <UIKit/UIKit.h>
#import <string>
#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/RCTTurboModule.h>
#import <react/renderer/uimanager/primitives.h>


@implementation LLM {
  LLaMARunner *runner;
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

- (void)onResult:(NSString *)token prompt:(NSString *)prompt {
  if ([token isEqualToString:prompt]) {
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    [self emitOnToken:token];
    [self->tempLlamaResponse appendString:token];
  });
}

- (void)updateDownloadProgress:(NSNumber *)progress {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self emitOnDownloadProgress:progress];
  });
}

- (void)loadLLM:(NSString *)modelSource tokenizerSource:(NSString *)tokenizerSource systemPrompt:(NSString *)systemPrompt contextWindowLength:(double)contextWindowLength resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
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
        NSUInteger contextWindowLengthUInt = (NSUInteger)round(contextWindowLength);
      
      self->conversationManager = [[ConversationManager alloc] initWithNumMessagesContextWindow: contextWindowLengthUInt systemPrompt: systemPrompt];
      self->isFetching = NO;
      resolve(@"Model and tokenizer loaded successfully");
      return;
    };
    
    [modelFetcher startDownloadingFileFromURL:modelURL];
  }];
}


- (void) runInference:(NSString *)input resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
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


-(void)interrupt {
  [self->runner stop];
}

-(void)deleteModule {
  self->runner = nil;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeLLMSpecJSI>(params);
}

@end
