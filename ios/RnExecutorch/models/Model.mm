#import "Model.h"
#import "../utils/Fetcher.h"

@implementation Model

- (NSArray *)forward:(NSArray *)input shape:(NSArray *)shape inputType:(NSNumber *)inputType {
    @try {
        NSArray *result = [module forward:input shape:shape inputType:inputType];
        return result;
    } @catch (NSException *exception) {
        NSLog(@"Exception encountered: %@", [exception reason]);
        return @[@10, @10, @10]; // Error handling logic here
    }
}

- (void)loadModel:(NSURL *)modelURL completion:(void (^)(BOOL success, NSNumber* code))completion {
    module = [[ETModel alloc] init];
    [Fetcher fetchResource:modelURL resourceType:ResourceType::MODEL completionHandler:^(NSString *filePath, NSError *error) {
        if (error) {
            NSLog(@"Error loading model: %@", [error localizedDescription]);
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
