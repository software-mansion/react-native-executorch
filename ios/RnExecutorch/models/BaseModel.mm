#import "BaseModel.h"
#import "../utils/ETError.h"

@implementation BaseModel

- (NSArray *)forward:(NSArray *)input {
  NSMutableArray *shapes = [NSMutableArray new];
  NSMutableArray *inputTypes = [NSMutableArray new];
  NSNumber *numberOfInputs = [module getNumberOfInputs];

  for (NSUInteger i = 0; i < [numberOfInputs intValue]; i++) {
    [shapes addObject:[module getInputShape:[NSNumber numberWithInt:i]]];
    [inputTypes addObject:[module getInputType:[NSNumber numberWithInt:i]]];
  }

  NSArray *result = [module forward:@[input] shapes:shapes inputTypes:inputTypes];
  return result;
}

- (NSArray *)forward:(NSArray *)inputs
              shapes:(NSArray *)shapes
          inputTypes:(NSArray *)inputTypes {
  NSArray *result = [module forward:inputs shapes:shapes inputTypes:inputTypes];
  return result;
}

- (void)loadModel:(NSURL *)modelURL
       completion:(void (^)(BOOL success, NSNumber *code))completion {
  module = [[ETModel alloc] init];
  NSNumber *result = [self->module loadModel:modelURL.path];
  if ([result intValue] != 0) {
    completion(NO, result);
    return;
  }

  completion(YES, result);
  return;
}

@end
