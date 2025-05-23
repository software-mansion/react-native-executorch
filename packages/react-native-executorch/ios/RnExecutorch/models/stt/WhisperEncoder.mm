#import "WhisperEncoder.hpp"
#import "../../utils/SFFT.hpp"
#import "../../utils/ScalarType.h"

NSArray *spectrogramInputType = [NSArray arrayWithObject:ScalarType.Float];
NSNumber *fftFrameSize = @256;

@implementation WhisperEncoder

- (NSArray *)encode:(NSArray *)waveform {
  NSArray *stft = [SFFT sfftFromWaveform:waveform fftSize:512 fftHopLength:160];
  NSNumber *numFrames = [NSNumber numberWithDouble:([stft count] / 256)];
  NSArray *inputShape = @[ @[ numFrames, fftFrameSize ] ];
  NSArray *result = [self forward:@[ stft ]
                           shapes:inputShape
                       inputTypes:spectrogramInputType];
  // unsquezing before the return, since forward returns an array of results;
  return [result objectAtIndex:0];
}

@end
