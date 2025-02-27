#import "WhisperEncoder.hpp"
#import "../../utils/ScalarType.h"

NSArray *spectrogramInputType = [NSArray arrayWithObject:ScalarType.Float];

@implementation WhisperEncoder

NSUInteger fftFrameLength = 256;

- (NSArray *)encode:(NSArray *)stft {
  NSNumber *numFrames =
              [NSNumber numberWithDouble:([[stft objectAtIndex:0] count] / fftFrameLength)];
  NSArray *shape = @[ @[ numFrames, @(fftFrameLength) ] ];
  NSArray *result = [self forward:stft
                           shapes:shape
                       inputTypes:spectrogramInputType];
  // unsquezing before the return, since forward returns an array of results;
  return [result objectAtIndex:0];
}

@end
