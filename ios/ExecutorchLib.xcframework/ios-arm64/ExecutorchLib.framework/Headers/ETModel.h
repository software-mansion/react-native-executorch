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
- (NSArray *)getInputShape;
- (NSNumber *)getInputType;

@end

#endif // ETModel_hpp
