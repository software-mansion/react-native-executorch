#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "SpeechToTextBaseModel.hpp"

@implementation SpeechToTextBaseModel

- (void)loadModuleHelper:(BaseModel *)model
       withSource:(NSString *)source
        onSuccess:(void (^)(void))success
        onFailure:(void (^)(NSString *))failure {

  [model loadModel:[NSURL URLWithString:source]
        completion:^(BOOL isSuccess, NSNumber *errorCode) {
          if (isSuccess) {
            success();
          } else {
            failure([NSString stringWithFormat:@"%ld", (long)[errorCode longValue]]);
          }
        }];
}

@end
