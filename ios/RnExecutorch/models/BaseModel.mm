#import "BaseModel.h"
#import "../utils/Fetcher.h"

@implementation BaseModel

- (NSArray *)forward:(NSArray *)input shape:(NSArray *)shape inputType:(NSNumber *)inputType error:(NSError **)error {
    @try {
        NSArray *result = [module forward:input shape:shape inputType:inputType];
        return result;
    } @catch (NSException *exception) {
      *error = [NSError errorWithDomain:@"forward_error" code:(long)exception.reason userInfo:nil];
    }
}

- (void)loadModel:(NSURL *)modelURL completion:(void (^)(BOOL success, NSNumber* code))completion {
    module = [[ETModel alloc] init];
    [Fetcher fetchResource:modelURL resourceType:ResourceType::MODEL completionHandler:^(NSString *filePath, NSError *error) {
      if (error) {
        completion(NO, @-1);
        return;
      }
      NSNumber *result = [self->module loadModel: filePath];
      if(result != 0){
        completion(NO, result);
        return;
      }
      
      completion(YES, result);
      return;
    }];
}

@end
