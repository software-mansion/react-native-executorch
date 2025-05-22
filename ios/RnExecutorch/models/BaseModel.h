#import "ExecutorchLib/ETModel.h"

@interface BaseModel : NSObject {
@protected
  ETModel *module;
}

- (NSArray *)forward:(NSArray *)inputs;

- (NSArray *)forward:(NSArray *)inputs
              shapes:(NSArray *)shapes
          inputTypes:(NSArray *)inputTypes;

- (NSArray *)execute:(NSString *)methodName
              inputs:(NSArray *)inputs
              shapes:(NSArray *)shapes
          inputTypes:(NSArray *)inputTypes;

- (NSNumber *)loadModel:(NSString *)modelSource;

@end
