#import "SpeechToTextBaseModel.hpp"

@implementation SpeechToTextBaseModel

- (void)loadModuleHelper:(BaseModel *)model
              withSource:(NSString *)source
               onSuccess:(void (^)(void))success
               onFailure:(void (^)(NSString *))failure {
  NSNumber *errorCode = [model loadModel:[NSURL URLWithString:source].path];

  if ([errorCode intValue] != 0) {
    failure([NSString stringWithFormat:@"%ld", (long)[errorCode longValue]]);
    return;
  }

  success();
}

@end
