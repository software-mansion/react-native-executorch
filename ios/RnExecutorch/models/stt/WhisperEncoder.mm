#import "WhisperEncoder.hpp"
#import "../../utils/ScalarType.h"
#import "../../utils/SFFT.hpp"


NSArray *spectrogramInputType = ScalarType.Float;
NSNumber *fftFrameSize = @512 / @2;

@implementation WhisperEncoder

- (NSArray *)encode:(NSArray *)waveform {
  NSArray *stft = [STFT stftFromWaveform:waveform fftSize:512 fftHopLength:160];
  NSNumber *numStftFrames = [stft count] / fftFrameSize;
  NSArray *inputShape = @[numStftFrames, @fftFrameSize];
  NSArray *result = [self forward:stft shapes:@[inputShape] inputTypes:@[spectrogramInputType]];
  // unsquezing before the return, since forward returns an array of results;
  return [result objectAtIndex:0];
}


@end
