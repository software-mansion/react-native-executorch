#import "WhisperDecoder.hpp"

NSNumber *encoderLastHiddenStateType = @6; // ScalarType::Float
NSNumber *prevTokensType = @3; // ScalarType::Int
NSArray *decoderInputTypes = @[prevTokensType, encoderLastHiddenStateType];
NSArray *encoderLastHiddenStateShape = @[@1, @1500, @384];

@implementation WhisperDecoder

- (NSArray *)decode:(NSArray *)prevTokens encoderLastHiddenState:(NSArray *)encoderLastHiddenState {
  NSNumber *tokensCount = @([prevTokens count]);
  NSArray *prevTokensShape = @[@1, tokensCount];
//  prevTokens = @[prevTokens];
    
  NSLog(@"prevtokens: %@", prevTokens);
  NSLog(@"prevTokens shape: %@", prevTokensShape);
    
  NSArray *predictedToken = [self forward:@[prevTokens, encoderLastHiddenState] shapes:@[prevTokensShape, encoderLastHiddenStateShape] inputTypes:decoderInputTypes];
    
  NSLog(@"predictedToken:  %@", predictedToken);
  return [predictedToken objectAtIndex:0];

}

@end
