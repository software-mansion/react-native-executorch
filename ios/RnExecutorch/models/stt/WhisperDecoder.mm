#import "WhisperDecoder.hpp"
#import "../../utils/ScalarType.h"

NSNumber *encoderLastHiddenStateType = ScalarType.Float;
NSNumber *prevTokensType = ScalarType.Int32;
NSArray *decoderInputTypes = @[ prevTokensType, encoderLastHiddenStateType ];
NSArray *encoderLastHiddenStateShape = @[ @1, @1500, @384 ];

@implementation WhisperDecoder

- (NSArray *)decode:(NSArray *)prevTokens
    encoderLastHiddenState:(NSArray *)encoderLastHiddenState {
  NSNumber *tokensCount = @([prevTokens count]);
  NSArray *prevTokensShape = @[ @1, tokensCount ];
  NSArray *predictedToken =
      [self forward:@[ prevTokens, encoderLastHiddenState ]
              shapes:@[ prevTokensShape, encoderLastHiddenStateShape ]
          inputTypes:decoderInputTypes];
  return [[predictedToken objectAtIndex:0] lastObject];
}

@end
