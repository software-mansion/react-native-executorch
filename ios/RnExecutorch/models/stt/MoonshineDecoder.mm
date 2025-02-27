#import "MoonshineDecoder.hpp"
#import "../../utils/ScalarType.h"

NSArray *decoderInputTypes = @[ScalarType.Long, ScalarType.Float];

@implementation MoonshineDecoder

- (NSArray *)decode:(NSArray *)prevTokens encoderLastHiddenState:(NSArray *)encoderLastHiddenState {
  NSNumber *noEncoderTokens = @(@([[encoderLastHiddenState objectAtIndex:0] count]).intValue / 288);
  NSArray  *encoderLastHiddenStateShape = @[@1, noEncoderTokens, @288];
  NSArray *prevTokensShape = @[@1, @([prevTokens count])];
  NSArray *predictedToken = [self execute:@"forward_cached"
                                  inputs:@[prevTokens, encoderLastHiddenState]
                                  shapes:@[prevTokensShape, encoderLastHiddenStateShape]
                                  inputTypes:decoderInputTypes];

  return [predictedToken objectAtIndex:0];
}

@end
