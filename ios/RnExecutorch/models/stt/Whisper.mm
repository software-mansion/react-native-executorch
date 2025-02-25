#ifndef Whisper_hpp
#define Whisper_hpp

#import "ExecutorchLib/ETModel.h"
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "WhisperEncoder.hpp"
#import "Whisperdecoder.hpp"

@implementation Whispe {
  BaseModel *preprocessor;
  WhisperEncoder *encoder;
  WhisperDecoder *decoder;
  NSNumber *START_TOKEN;
  NSNumber *EOS_TOKEN;
  int fftSize;
  int maxSeqLen;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    fftSize = 512;
    START_TOKEN = @50257;
    EOS_TOKEN = @50256;
    maxSeqLen = 512;
  }
  return self;
}

- (NSArray *)encode:(NSArray *)waveform {
  NSUInteger fftFrameLength = self->fftSize / 2;
        
  if (!self->encoder || !self->preprocessor) {
    [NSException raise:@"model_initialization_error" format:nil];
  }

  NSNumber *numFrames = [NSNumber numberWithDouble:(stft.count / fftFrameLength)];
  NSArray *mel = [self->preprocessor
          forward:@[ stft ]
          shapes:@[ @[
            numFrames,
            [NSNumber numberWithUnsignedInteger:fftFrameLength]
          ] ]
      inputTypes:@[ ScalarType.Float ]];
  NSArray *encodingResult = [self->encoder encode:@[ mel ]];
  

  if (!encodingResult) {
    [NSException raise:@"forward_error" format:nil];
  }

  NSArray *waveformShape = [NSArray arrayWithObject:@[@1, @([waveform[0] count])]];
  NSArray *result = [self->encoder forward:waveform shapes:waveformShape inputTypes:waveformTypes];
  
  return [result objectAtIndex:0];
}

- (NSArray *)decode:(NSArray *)prevTokens encoderLastHiddenState:(NSArray *)encoderLastHiddenState{
  return [self->decoder decode:prevTokens encoderLastHiddenState:encoderLastHiddenState];
}

- (void)loadModules:(NSString[] *)modelSources {

  preprocessor = [[BaseModel alloc] init];
  encoder = [[WhisperEncoder alloc] init];
  decoder = [[WhisperDecoder alloc] init];

  // Load preprocessor first
  [self loadModuleHelper:preprocessor
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



#endif /* Whisper_hpp */
