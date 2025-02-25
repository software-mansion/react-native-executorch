#import "Whisper.hpp"
#import "ExecutorchLib/ETModel.h"
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "WhisperEncoder.hpp"
#import "Whisperdecoder.hpp"
#import "../../utils/SFFT.hpp"
#import "../../utils/ScalarType.h"

@implementation Whisper {
  BaseModel *preprocessor;
  WhisperEncoder *encoder;
  WhisperDecoder *decoder;
  NSNumber *START_TOKEN;
  NSNumber *EOS_TOKEN;
  int maxSeqLen;
  int fftSize;
  int fftHopLength;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    fftSize = 512;
    START_TOKEN = @50257;
    EOS_TOKEN = @50256;
    maxSeqLen = 512;
    fftHopLength = 160;
  }
  return self;
}

- (NSArray *)encode:(NSArray *)waveform {
  NSUInteger fftFrameLength = self->fftSize / 2;
        
  if (!self->encoder || !self->preprocessor) {
    [NSException raise:@"model_initialization_error" format:nil];
  }
  NSArray *sfft = [SFFT sfftFromWaveform:waveform fftSize:self->fftSize fftHopLength:self->fftHopLength];
  NSNumber *numFrames = [NSNumber numberWithDouble:(sfft.count / fftFrameLength)];
  NSArray *mel = [self->preprocessor
          forward:@[ sfft ]
          shapes:@[ @[
            numFrames,
            [NSNumber numberWithUnsignedInteger:fftFrameLength]
          ] ]
      inputTypes:@[ ScalarType.Float ]];
  NSArray *encodingResult = [self->encoder encode:@[ mel ]];
  
  if (!encodingResult) {
    [NSException raise:@"forward_error" format:nil];
  }
  return encodingResult;
}

- (NSArray *)decode:(NSArray *)prevTokens encoderLastHiddenState:(NSArray *)encoderLastHiddenState{
  return [self->decoder decode:prevTokens encoderLastHiddenState:encoderLastHiddenState];
}

- (void)loadModules:(NSArray *)modelSources {

  self->preprocessor = [[BaseModel alloc] init];
  self->encoder = [[WhisperEncoder alloc] init];
  self->decoder = [[WhisperDecoder alloc] init];

  // Load preprocessor first
  [self loadModuleHelper:self->preprocessor
    withSource:[modelSources objectAtIndex:0]
    onSuccess:^{
      // Load encoder after preprocessor
      [self loadModuleHelper:self->encoder
        withSource:[modelSources objectAtIndex:1]
        onSuccess:^{
          // Load decoder after encoder
          [self loadModuleHelper:self->decoder
            withSource:[modelSources objectAtIndex:2]
            onSuccess:^{}
            onFailure:^(NSString *errorCode) {
              [NSException raise:@"init_decoder_error" format:@"%d", errorCode];
            }];
        }
        onFailure:^(NSString *errorCode) {
          [NSException raise:@"init_encoder_error" format:@"%d", errorCode];
        }];
    }
    onFailure:^(NSString *errorCode) {
      [NSException raise:@"init_preprocessor_error" format:@"%d", errorCode];
    }];
}

@end
