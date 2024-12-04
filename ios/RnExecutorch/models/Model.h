#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "ETModel.h"

@interface Model : NSObject
{
@protected
    ETModel *module;
}

- (NSArray *)forward:(NSArray *)input shape:(NSArray *)shape inputType:(NSNumber *)inputType;
- (void)loadModel:(NSURL *)modelURL completion:(void (^)(BOOL success, NSNumber *code))completion;

@end
