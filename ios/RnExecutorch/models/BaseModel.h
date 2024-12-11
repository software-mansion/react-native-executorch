#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "ExecutorchLib/ETModel.h"

@interface BaseModel : NSObject
{
@protected
  ETModel *module;
}

- (NSArray *)forward:(NSArray *)input;
- (void)loadModel:(NSURL *)modelURL completion:(void (^)(BOOL success, NSNumber *code))completion;

@end
