#import "ETModel.h"

@implementation ETModel

- (NSNumber *)loadModel:(NSString *)filePath {
  return @(0);
}

- (NSNumber *)loadMethod:(NSString *)methodName {
  return @(0);
}

- (NSNumber *)loadForward {
  return @(0);
}

- (NSNumber *)getNumberOfInputs {
  return @(0);
}

- (NSNumber *)getInputType:(NSNumber *)index {
  return @(0);
}

- (NSArray *)getInputShape:(NSNumber *)index {
  return @[];
}

- (NSNumber *)getNumberOfOutputs {
  return @(0);
}

- (NSNumber *)getOutputType:(NSNumber *)index {
  return @(0);
}

- (NSArray *)getOutputShape:(NSNumber *)index {
  return @[];
}

- (NSArray *)execute:(NSString *)methodName
              inputs:(NSArray *)inputs
              shapes:(NSArray *)shapes
          inputTypes:(NSArray *)inputTypes {
  return @[];
}

- (NSArray *)forward:(NSArray *)inputs
              shapes:(NSArray *)shapes
          inputTypes:(NSArray *)inputTypes {
  return @[];
}

@end
