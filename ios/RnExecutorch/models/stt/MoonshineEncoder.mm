#import "MoonshineEncoder.hpp"
#import "../../utils/ScalarType.h"

NSArray *waveformTypes = [NSArray arrayWithObject:ScalarType.Float];

@implementation MoonshineEncoder

- (NSArray *)encode:(NSArray *)waveform {
  NSArray *waveformShape =
      [NSArray arrayWithObject:@[ @1, @([waveform count]) ]];
  NSArray *result = [self forward:[NSArray arrayWithObject:waveform]
                           shapes:waveformShape
                       inputTypes:waveformTypes];

  return [result objectAtIndex:0];
}

@end
