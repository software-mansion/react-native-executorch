#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "ETModel.h"

@interface BaseModel : NSObject
{
@protected
    ETModel *module;
}

- (NSArray *)forward:(NSArray *)input shape:(NSArray *)shape inputType:(NSNumber *)inputType error:(NSError **)error;
- (void)loadModel:(NSURL *)modelURL completion:(void (^)(BOOL success, NSNumber *code))completion;

@end
