#import "BaseModel.h"
#import "../utils/ETError.h"
#import "../utils/Fetcher.h"

@implementation BaseModel

- (NSArray *)forward:(NSArray *)input {
  NSArray *result = [module forward:input shape:[module getInputShape:@0] inputType:[module getInputType: @0]];
  return result;
}

- (void)loadModel:(NSURL *)modelURL completion:(void (^)(BOOL success, NSNumber* code))completion {
  module = [[ETModel alloc] init];
  [Fetcher fetchResource:modelURL resourceType:ResourceType::MODEL completionHandler:^(NSString *filePath, NSError *error) {
    if (error) {
      completion(NO, @(InvalidModelPath));
      return;
    }
    NSNumber *result = [self->module loadModel: filePath];
    if([result intValue] != 0){
      completion(NO, result);
      return;
    }
    
    completion(YES, result);
    return;
  }];
}

@end
