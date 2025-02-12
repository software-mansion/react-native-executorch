#import "SpeechToText.h"
#import "models/BaseModel.h"
#import "models/stt/WhisperDecoder.hpp"
#import "models/stt/WhisperEncoder.hpp"
#import "utils/ETError.h"
#import "utils/Fetcher.h"
#import <ExecutorchLib/ETModel.h>
#import <React/RCTBridgeModule.h>

@implementation SpeechToText {
  WhisperEncoder *encoder;
  WhisperDecoder *decoder;
  BaseModel *preprocessor;
}

RCT_EXPORT_MODULE()

-(void)generateSync:(NSArray *)fft
          numFrames:(double)numFrames
          prevTokens:(NSArray *)prevTokens
{
  NSNumber *START_TOKEN = @50257;
  NSNumber *EOS_TOKEN = @50256;
  NSUInteger maxSeqLen = 128; // TODO: this should be a param
  
  NSMutableArray *mutablePrevTokens;
  if (prevTokens.count == 0) {
      mutablePrevTokens = [NSMutableArray arrayWithObject:START_TOKEN];
  } else {
      mutablePrevTokens = [prevTokens mutableCopy];
  }

  if (!encoder || !decoder || !preprocessor) {
    // TODO: handle this better
    NSLog(@"Model is not properly initialized!");
    return;
  }

    NSNumber *numFramesNSNumber = [NSNumber numberWithDouble:numFrames];
    NSArray *mel = [preprocessor forward:@[fft] shapes:@[@[numFramesNSNumber, @256]] inputTypes:@[@6]];
  NSArray *encodingResult = [encoder encode:@[mel]];
  if (!encodingResult) {
    // TODO: handle this better
    NSLog(@"Encoding was not succesful!");
    return;
  }

  NSUInteger currentSeqLen = 0;
  while (currentSeqLen < maxSeqLen) {
    NSArray *result = [decoder decode:mutablePrevTokens encoderLastHiddenState:encodingResult];
    if (!result || result.count == 0) {
      return;
    }

    NSNumber *predictedToken = result[0];
    [mutablePrevTokens addObject:predictedToken];
    dispatch_async(dispatch_get_main_queue(), ^{
      [self emitOnToken:[predictedToken stringValue]];
    });

    if ([predictedToken isEqualToNumber:EOS_TOKEN]) {
      break;
    }
    currentSeqLen++;
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
  [self loadModuleHelper:preprocessor withSource:preprocessorSource onSuccess:^{
    // Load encoder after preprocessor
    [self loadModuleHelper:encoder withSource:encoderSource onSuccess:^{
      // Load decoder after encoder
      [self loadModuleHelper:decoder withSource:decoderSource onSuccess:^{
        resolve(@(0));
      } onFailure:^(NSString *errorCode) {
        reject(@"init_decoder_error", errorCode, nil);
      }];
    } onFailure:^(NSString *errorCode) {
      reject(@"init_encoder_error", errorCode, nil);
    }];
  } onFailure:^(NSString *errorCode) {
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
            failure([NSString stringWithFormat:@"%ld", (long)[errorCode longValue]]);
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
