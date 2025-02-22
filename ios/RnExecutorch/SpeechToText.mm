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
  WhisperEncoder *encoder;
  WhisperDecoder *decoder;
  BaseModel *preprocessor;
  NSNumber *START_TOKEN;
  NSNumber *EOS_TOKEN;
  int fftSize;
  int fftHopLength;
  int maxSeqLen;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    maxSeqLen = 512;
    fftSize = 512;
    fftHopLength = 160;
    START_TOKEN = @50257;
    EOS_TOKEN = @50256;
  }
  return self;
}

RCT_EXPORT_MODULE()

- (void)generate:(NSArray *)waveform
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject {
  @try {
    NSArray *stft = [SFFT stftFromWaveform:waveform];
    dispatch_async(
        dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
          NSUInteger fftFrameLength = self->fftSize / 2;
          NSMutableArray *mutablePrevTokens = [NSMutableArray arrayWithObject:self->START_TOKEN];
                
          if (!self->encoder || !self->decoder || !self->preprocessor) {
            reject(@"model_initialization_error", nil, nil);
            return;
          }

          NSNumber *numFrames =
              [NSNumber numberWithDouble:(stft.count / fftFrameLength)];
          NSArray *mel = [self->preprocessor
                 forward:@[ stft ]
                  shapes:@[ @[
                    numFrames,
                    [NSNumber numberWithUnsignedInteger:fftFrameLength]
                  ] ]
              inputTypes:@[ ScalarType.Float ]];
          NSDate *start = [NSDate date];
          NSArray *encodingResult = [self->encoder encode:@[ mel ]];
          

          if (!encodingResult) {
            reject(@"forward_error", @"Encoding returned an empty result.", nil);
            return;
          }

          NSNumber *currentSeqLen = @0;
          while ([currentSeqLen unsignedIntegerValue] < self -> maxSeqLen) {
            NSArray *result = [self->decoder decode:mutablePrevTokens
                             encoderLastHiddenState:encodingResult];
            if (!result || result.count == 0) {
              reject(@"forward_error", @"Decoder returned an empty result.",
                     nil);
              return;
            }
            NSNumber *predictedToken = result[0];
            [mutablePrevTokens addObject:predictedToken];
            [self emitOnToken:predictedToken];
            if ([predictedToken isEqualToNumber:self->EOS_TOKEN]) {
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

- (void)loadModule:(NSString *)preprocessorSource
     encoderSource:(NSString *)encoderSource
     decoderSource:(NSString *)decoderSource
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {

  preprocessor = [[BaseModel alloc] init];
  encoder = [[WhisperEncoder alloc] init];
  decoder = [[WhisperDecoder alloc] init];

  // Load preprocessor first
  [self loadModuleHelper:preprocessor
      withSource:preprocessorSource
      onSuccess:^{
        // Load encoder after preprocessor
        [self loadModuleHelper:self->encoder
            withSource:encoderSource
            onSuccess:^{
              // Load decoder after encoder
              [self loadModuleHelper:self->decoder
                  withSource:decoderSource
                  onSuccess:^{
                    resolve(@(0));
                  }
                  onFailure:^(NSString *errorCode) {
                    reject(@"init_decoder_error", errorCode, nil);
                  }];
            }
            onFailure:^(NSString *errorCode) {
              reject(@"init_encoder_error", errorCode, nil);
            }];
      }
      onFailure:^(NSString *errorCode) {
        reject(@"init_preprocessor_error", errorCode, nil);
      }];
}

- (void)loadModuleHelper:(id)model
              withSource:(NSString *)source
               onSuccess:(void (^)(void))success
               onFailure:(void (^)(NSString *))failure {

  [model loadModel:[NSURL URLWithString:source]
        completion:^(BOOL isSuccess, NSNumber *errorCode) {
          if (isSuccess) {
            success();
          } else {
            failure([NSString
                stringWithFormat:@"%ld", (long)[errorCode longValue]]);
          }
        }];
}

- (void)encode:(NSArray *)input
       resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject {
  @try {
    NSArray *encodingResult = [encoder encode:input];
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
  @try {
    NSArray *token = [decoder decode:prevTokens
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
