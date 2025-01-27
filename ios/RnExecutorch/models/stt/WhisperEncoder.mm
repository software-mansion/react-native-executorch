#import "WhisperEncoder.hpp"

NSArray *spectrogramShape = [NSArray arrayWithObject:@[@1, @80, @3000]];
// TODO: we could introduce a ScalarType enum in Obj-C to avoid doing something like this
NSArray *spectrogramInputType = [NSArray arrayWithObject:@6];

@implementation WhisperEncoder

- (NSArray *)encode:(NSArray *)melSpectrogram {
  NSArray *result = [self forward:melSpectrogram shapes:spectrogramShape inputTypes:spectrogramInputType];
  // unsquezing before the return, since forward returns an array of results;
  return [result objectAtIndex:0];
}


@end
