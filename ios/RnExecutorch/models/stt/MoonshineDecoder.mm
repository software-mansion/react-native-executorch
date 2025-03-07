#import "MoonshineDecoder.hpp"
#import "../../utils/ScalarType.h"

@implementation MoonshineDecoder

- (NSArray *)decode:(NSArray *)prevTokens
    encoderLastHiddenState:(NSArray *)encoderLastHiddenState {
  NSNumber *innerDim = @288;
  NSNumber *noEncoderTokens =
      @(@([[encoderLastHiddenState objectAtIndex:0] count]).intValue /
        [innerDim intValue]);
  NSArray *encoderLastHiddenStateShape = @[ @1, noEncoderTokens, innerDim ];
  NSArray *prevTokensShape = @[ @1, @([prevTokens count]) ];
  NSArray *predictedToken =
      [self execute:@"forward_cached"
              inputs:@[ prevTokens, encoderLastHiddenState ]
              shapes:@[ prevTokensShape, encoderLastHiddenStateShape ]
          inputTypes:@[ ScalarType.Long, ScalarType.Float ]];

  return [predictedToken objectAtIndex:0];
}

@end
