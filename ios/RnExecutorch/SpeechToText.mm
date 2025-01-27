#import "SpeechToText.h"
#import "utils/Fetcher.h"
#import "models/BaseModel.h"
#import "models/stt/WhisperEncoder.hpp"
#import "models/stt/WhisperDecoder.hpp"
#import "utils/ETError.h"
#import <ExecutorchLib/ETModel.h>
#import <React/RCTBridgeModule.h>

@implementation SpeechToText {
  WhisperEncoder* encoder;
  WhisperDecoder* decoder;
}

RCT_EXPORT_MODULE()

- (void)generate:(NSArray *)spectogram {
    NSNumber *START_TOKEN = @50257;
    NSMutableArray *prevTokens = [NSMutableArray arrayWithObject:START_TOKEN];
    
    // Running encoding for each 30s audio chunk
    NSArray *encodingResult = [encoder encode:spectogram];
    while (true) {
        NSArray *result = [decoder decode:prevTokens encoderLastHiddenState:encodingResult];
        NSNumber *predictedToken = [result objectAtIndex:0];
        [prevTokens addObject:predictedToken];
        if ([predictedToken isEqualToNumber:@50256]) {
            break;
        }
    }
}

- (void)loadModule:(NSString *)encoderSource
    decoderSource:(NSString *)decoderSource
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject {
  encoder = [[WhisperEncoder alloc] init];
  decoder = [[WhisperDecoder alloc] init];
  
  [encoder loadModel:[NSURL URLWithString:encoderSource] completion:^(BOOL encoderSuccess, NSNumber *encoderErrorCode) {
    if (encoderSuccess) {
      // Initialize decoder after encoder loads successfully
      decoder = [[WhisperDecoder alloc] init];
      [decoder loadModel:[NSURL URLWithString:decoderSource] completion:^(BOOL decoderSuccess, NSNumber *decoderErrorCode) {
        if (decoderSuccess) {
          resolve(decoderErrorCode); // Resolve with decoder's success code
        } else {
          reject(@"init_decoder_error", [NSString stringWithFormat:@"%ld", (long)[decoderErrorCode longValue]], nil);
        }
      }];
    } else {
      reject(@"init_encoder_error", [NSString stringWithFormat:@"%ld", (long)[encoderErrorCode longValue]], nil);
    }
  }];
}



- (void)encode:(NSArray *)input
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
  @try {
    [self generate:input];
    resolve(@[]);
  } @catch (NSException *exception) {
    reject(@"forward_error", [NSString stringWithFormat:@"%@", exception.reason],
           nil);
  }
}

- (void)decode:(NSArray *)prevTokens
        encoderOutput:(NSArray *)encoderOutput
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject {
  @try {
    NSArray *token = [decoder decode:prevTokens encoderLastHiddenState:encoderOutput];
    resolve(token);
  } @catch (NSException *exception) {
    reject(@"forward_error", [NSString stringWithFormat:@"%@", exception.reason],
           nil);
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeSpeechToTextSpecJSI>(params);
}

@end
