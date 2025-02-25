#import "SpeechToText.h"
#import "models/BaseModel.h"
#import "models/stt/WhisperDecoder.hpp"
#import "models/stt/WhisperEncoder.hpp"
#import <Accelerate/Accelerate.h>
#import "utils/Fetcher.h"
#import "utils/SFFT.hpp"
#import <ExecutorchLib/ETModel.h>
#import <React/RCTBridgeModule.h>
#import "./utils/ScalarType.h"

@implementation SpeechToText {
  Whisper *whisper;
  Moonshine *moonshine;
}

RCT_EXPORT_MODULE()

- (void)generate:(NSArray *)waveform
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject {
  @try {
    NSObject model = self->whisper ? self->whisper : self->moonshine;
    NSArray *stft = [SFFT stftFromWaveform:waveform];
    dispatch_async(
        dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
          NSMutableArray *mutablePrevTokens = [NSMutableArray arrayWithObject:model->START_TOKEN];

          NSNumber *currentSeqLen = @0;
          while ([currentSeqLen unsignedIntegerValue] < model -> maxSeqLen) {
            NSArray *result = [model->decoder decode:mutablePrevTokens
                             encoderLastHiddenState:encodingResult];
            if (!result || result.count == 0) {
              reject(@"forward_error", @"Decoder returned an empty result.",
                     nil);
              return;
            }
            NSNumber *predictedToken = result[0];
            [mutablePrevTokens addObject:predictedToken];
            [self emitOnToken:predictedToken];
            if ([predictedToken isEqualToNumber:model->EOS_TOKEN]) {
              break;
            }
            currentSeqLen = @([currentSeqLen unsignedIntegerValue] + 1);
          }
          resolve(mutablePrevTokens);
        });
  } @catch (NSException *exception) {
    NSLog(@"Exception caught before dispatch: %@, Reason: %@", exception.name,
          exception.reason);
    reject(@"exception_before_dispatch", exception.reason, nil);
  }
}

- (void)loadModule:(NSString *)modelName
     modelSources:(NSString[] *)modelSources
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {


  NSObject *model;
  if(modelName == @"moonshine") {
    if ([modelName count] != @2) reject(@"corrupted model sources", nil, nil);

    moonshine = [[Moonshine alloc] init];
    model = moonshine;
  }
  if(modelName == @"whisper") {
    if ([modelName count] != @3) reject(@"corrupted model sources", nil, nil);

    whisper = [[Whisper alloc] init];
    model = whisper;
  }

  @try {
    [model loadModules: modelSources]
  } @catch (NSException *exception) {
    reject(@"init_decoder_error", [NSString stringWithFormat:@"%@", exception.reason], nil);
  }
  resolve(@(0));
}

- (void)encode:(NSArray *)input
       resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject {
  NSObject model = self->whisper ? self->whisper : self->moonshine;
  @try {
    NSArray *encodingResult = [model->encoder encode:input];
    resolve(encodingResult);
  } @catch (NSException *exception) {
    reject(@"forward_error",
           [NSString stringWithFormat:@"%@", exception.reason], nil);
  }
}

- (void)decode:(NSArray *)prevTokens
    encoderOutput:(NSArray *)encoderOutput
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject {
  NSObject model = self->whisper ? self->whisper : self->moonshine;
  @try {
    NSArray *token = [model->decoder decode:prevTokens
              encoderLastHiddenState:encoderOutput];
    resolve(token);
  } @catch (NSException *exception) {
    reject(@"forward_error",
           [NSString stringWithFormat:@"%@", exception.reason], nil);
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeSpeechToTextSpecJSI>(params);
}

@end
