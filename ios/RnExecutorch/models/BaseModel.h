#import "ExecutorchLib/ETModel.h"
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface BaseModel : NSObject {
@protected
  ETModel *module;
}

- (NSArray *)forward:(NSArray *)input;

// TODO: This method should be removed, `forward` should accept multiple inputs
// instead
- (NSArray *)forwardMultiple:(NSArray *)inputs;

- (NSArray *)forward:(NSArray *)inputs
              shapes:(NSArray *)shapes
          inputTypes:(NSArray *)inputTypes;

- (NSArray *)execute:(NSString *)methodName
              inputs:(NSArray *)inputs
              shapes:(NSArray *)shapes
          inputTypes:(NSArray *)inputTypes;

// TODO: This method should be synchronous
- (void)loadModel:(NSURL *)modelURL
       completion:(void (^)(BOOL success, NSNumber *code))completion;

@end
