#import "LLM.h"
#import "utils/llms/Constants.h"
#import "utils/llms/ConversationManager.h"
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
  ConversationManager *conversationManager;
  NSMutableString *tempLlamaResponse;
}

- (instancetype)init {
  self = [super init];
  if (self) {
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

- (void)loadLLM:(NSString *)modelSource
        tokenizerSource:(NSString *)tokenizerSource
           systemPrompt:(NSString *)systemPrompt
         messageHistory:(NSArray *)messageHistory
    contextWindowLength:(double)contextWindowLength
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject {
  NSURL *modelURL = [NSURL URLWithString:modelSource];
  NSURL *tokenizerURL = [NSURL URLWithString:tokenizerSource];
  @try {
    self->runner = [[LLaMARunner alloc] initWithModelPath:modelURL.path
                                            tokenizerPath:tokenizerURL.path];
    NSUInteger contextWindowLengthUInt = (NSUInteger)round(contextWindowLength);

    self->conversationManager = [[ConversationManager alloc]
        initWithNumMessagesContextWindow:contextWindowLengthUInt
                            systemPrompt:systemPrompt
                          messageHistory:messageHistory];

    self->tempLlamaResponse = [NSMutableString string];
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
  [conversationManager addResponse:input senderRole:ChatRole::USER];
  NSString *prompt = [conversationManager getConversation];

  dispatch_async(
      dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSError *error = nil;
        [self->runner generate:prompt
             withTokenCallback:^(NSString *token) {
               [self onResult:token prompt:prompt];
             }
                         error:&error];

        // make sure to add eot token once generation is done
        if (![self->tempLlamaResponse hasSuffix:END_OF_TEXT_TOKEN_NS]) {
          [self onResult:END_OF_TEXT_TOKEN_NS prompt:prompt];
        }

        if (self->tempLlamaResponse) {
          [self->conversationManager addResponse:self->tempLlamaResponse
                                      senderRole:ChatRole::ASSISTANT];
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
