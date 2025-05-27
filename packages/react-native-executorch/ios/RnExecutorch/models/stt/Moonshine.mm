#import "Moonshine.hpp"

@implementation Moonshine {
  MoonshineEncoder *encoder;
  MoonshineDecoder *decoder;
  NSNumber *START_TOKEN;
  NSNumber *EOS_TOKEN;
  NSArray *encoderLastHiddenState;
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
  return [self->decoder decode:prevTokens
        encoderLastHiddenState:self->encoderLastHiddenState];
}

- (void)loadModules:(NSArray *)modelSources {

  self->encoder = [[MoonshineEncoder alloc] init];
  self->decoder = [[MoonshineDecoder alloc] init];

  // Load encoder
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
