#ifndef ETModel_hpp
#define ETModel_hpp

#import <UIKit/UIKit.h>

@interface ETModel : NSObject

- (NSNumber *)loadModel:(NSString *)filePath;
- (NSNumber *)loadMethod:(NSString *)methodName;
- (NSNumber *)loadForward;
- (NSArray *)forward:(NSArray *)input
               shape:(NSArray *)shape
           inputType:(NSNumber *)inputType;
- (NSNumber *)getNumberOfInputs;
- (NSNumber *)getInputType:(NSNumber *)index;
- (NSArray *)getInputShape:(NSNumber *)index;
- (NSNumber *)getNumberOfOutputs;
- (NSNumber *)getOutputType:(NSNumber *)index;
- (NSArray *)getOutputShape:(NSNumber *)index;


@end

#endif // ETModel_hpp
