#ifndef Whisper_hpp
#define Whisper_hpp

#import "ExecutorchLib/ETModel.h"
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "MoonshineEncoder.hpp"
#import "Moonshinedecoder.hpp"

@implementation Moonshine {
  MoonshineEncoder *encoder;
  MoonshineDecoder *decoder;
  NSNumber *START_TOKEN;
  NSNumber *EOS_TOKEN;
  int maxSeqLen;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    START_TOKEN = @1;
    EOS_TOKEN = @2;
    maxSeqLen = 180;
  }
  return self;
}

- (NSArray *)encode:(NSArray *)waveform {
  return [self->encoder encode:waveform];
}

- (NSArray *)decode:(NSArray *)prevTokens encoderLastHiddenState:(NSArray *)encoderLastHiddenState {
  return [self->decoder decode:prevTokens encoderLastHiddenState:encoderLastHiddenState];
}

- (void)loadModules:(NSString *)modelSources {

  encoder = [[MoonshineEncoder alloc] init];
  decoder = [[MoonshineDecoder alloc] init];

  // Load encoder
  [self loadModuleHelper:self->encoder
    withSource:[modelSources objectAtIndex:0]
    onSuccess:^{
      // Load decoder after encoder
      [self loadModuleHelper:self->decoder
        withSource:[modelSources objectAtIndex:1]
        onSuccess:^{}
        onFailure:^(NSString *errorCode) {
          [NSException raise:@"init_decoder_error" format:@"%d", errorCode];
        }];
    }
    onFailure:^(NSString *errorCode) {
      [NSException raise:@"init_encoder_error" format:@"%d", errorCode];
    }];
}

@end



#endif /* Whisper_hpp */
