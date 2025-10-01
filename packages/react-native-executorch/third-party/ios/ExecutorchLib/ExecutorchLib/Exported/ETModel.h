#ifndef ETModel_hpp
#define ETModel_hpp

#import <UIKit/UIKit.h>

@interface ETModel : NSObject

- (NSNumber *)loadModel:(NSString *)filePath;
- (NSNumber *)loadMethod:(NSString *)methodName;
- (NSNumber *)loadForward;
- (NSArray *)execute:(NSString *)methodName
              inputs:(NSArray *)inputs
              shapes:(NSArray *)shapes
          inputTypes:(NSArray *)inputTypes;
- (NSArray *)forward:(NSArray *)inputs
              shapes:(NSArray *)shapes
          inputTypes:(NSArray *)inputTypes;
- (NSNumber *)getNumberOfInputs;
- (NSNumber *)getInputType:(NSNumber *)index;
- (NSArray *)getInputShape:(NSNumber *)index;
- (NSNumber *)getNumberOfOutputs;
- (NSNumber *)getOutputType:(NSNumber *)index;
- (NSArray *)getOutputShape:(NSNumber *)index;

@end

#endif // ETModel_hpp
