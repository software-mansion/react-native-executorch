#import "BaseModel.h"

@implementation BaseModel

- (NSArray *)forward:(NSArray *)inputs {
  NSMutableArray *shapes = [NSMutableArray new];
  NSMutableArray *inputTypes = [NSMutableArray new];
  NSNumber *numberOfInputs = [module getNumberOfInputs];

  for (NSUInteger i = 0; i < [numberOfInputs intValue]; i++) {
    [shapes addObject:[module getInputShape:[NSNumber numberWithInt:i]]];
    [inputTypes addObject:[module getInputType:[NSNumber numberWithInt:i]]];
  }

  NSArray *result = [module forward:inputs shapes:shapes inputTypes:inputTypes];

  return result;
}

- (NSArray *)forward:(NSArray *)inputs
              shapes:(NSArray *)shapes
          inputTypes:(NSArray *)inputTypes {
  NSArray *result = [module forward:inputs shapes:shapes inputTypes:inputTypes];
  return result;
}

- (NSArray *)execute:(NSString *)methodName
              inputs:(NSArray *)inputs
              shapes:(NSArray *)shapes
          inputTypes:(NSArray *)inputTypes {
  NSArray *result = [module execute:methodName
                             inputs:inputs
                             shapes:shapes
                         inputTypes:inputTypes];
  return result;
}

- (NSNumber *)loadModel:(NSString *)modelSource {
  module = [[ETModel alloc] init];
  return [self->module loadModel:modelSource];
}

@end
