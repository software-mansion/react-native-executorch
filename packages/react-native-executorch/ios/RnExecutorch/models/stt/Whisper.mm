#import "Whisper.hpp"
#import "WhisperEncoder.hpp"
#import "Whisperdecoder.hpp"

@implementation Whisper {
  WhisperEncoder *encoder;
  WhisperDecoder *decoder;
  NSNumber *START_TOKEN;
  NSNumber *EOS_TOKEN;
  NSArray *encoderLastHiddenState;
  int maxSeqLen;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    START_TOKEN = @50257;
    EOS_TOKEN = @50256;
    maxSeqLen = 512;
  }
  return self;
}

- (NSArray *)encode:(NSArray *)waveform {
  self->encoderLastHiddenState = [self->encoder encode:waveform];

  if (!self->encoderLastHiddenState) {
    [NSException raise:@"forward_error" format:nil];
  }
  return self->encoderLastHiddenState;
}

- (NSArray *)decode:(NSArray *)prevTokens
    encoderLastHiddenState:(NSArray *)encoderLastHiddenState {
  if ([encoderLastHiddenState count] > 0) {
    return [self->decoder decode:prevTokens
          encoderLastHiddenState:encoderLastHiddenState];
  }
  return [self->decoder
                      decode:prevTokens
      encoderLastHiddenState:[NSMutableArray
                                 arrayWithObject:self->encoderLastHiddenState]];
}

- (void)loadModules:(NSArray *)modelSources {

  self->encoder = [[WhisperEncoder alloc] init];
  self->decoder = [[WhisperDecoder alloc] init];

  // Load encoder after preprocessor
  [self loadModuleHelper:self->encoder
      withSource:[modelSources objectAtIndex:0]
      onSuccess:^{
        // Load decoder after encoder
        [self loadModuleHelper:self->decoder
            withSource:[modelSources objectAtIndex:1]
            onSuccess:^{
            }
            onFailure:^(NSString *errorCode) {
              [NSException raise:@"init_decoder_error" format:@"%d", errorCode];
            }];
      }
      onFailure:^(NSString *errorCode) {
        [NSException raise:@"init_encoder_error" format:@"%d", errorCode];
      }];
}

@end
