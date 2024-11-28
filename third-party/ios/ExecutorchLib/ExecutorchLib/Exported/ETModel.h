#pragma once

#import <UIKit/UIKit.h>

@interface ETModel : NSObject

- (NSNumber *)loadModel:(NSString *)filePath;
- (NSNumber *)loadMethod:(NSString *)methodName;
- (NSNumber *)loadForward;
- (NSArray *)forward:(NSArray *)input shape:(NSArray *)shape inputType:(NSNumber *)inputType;

@end
