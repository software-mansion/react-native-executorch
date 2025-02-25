#import "MoonshineEncoder.hpp"

NSArray *waveformTypes = [NSArray arrayWithObject:@6];

@implementation MoonshineEncoder

- (NSArray *)encode:(NSArray *)waveform {
  NSArray *waveformShape = [NSArray arrayWithObject:@[@1, @([waveform[0] count])]];
  NSArray *result = [self forward:waveform shapes:waveformShape inputTypes:waveformTypes];
  
  return [result objectAtIndex:0];
}


@end
