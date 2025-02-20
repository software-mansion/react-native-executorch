#import "WhisperEncoder.hpp"
#import "../../utils/ScalarType.h"

NSArray *spectrogramShape = [NSArray arrayWithObject:@[@1, @80, @3000]];
NSArray *spectrogramInputType = [NSArray arrayWithObject:ScalarType.Float];

@implementation WhisperEncoder

- (NSArray *)encode:(NSArray *)melSpectrogram {
  NSArray *result = [self forward:melSpectrogram shapes:spectrogramShape inputTypes:spectrogramInputType];
  // unsquezing before the return, since forward returns an array of results;
  return [result objectAtIndex:0];
}


@end
