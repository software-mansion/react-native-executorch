#ifndef MoonshineEncoder_hpp
#define MoonshineEncoder_hpp

#import "../BaseModel.h"
#import "ExecutorchLib/ETModel.h"
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface MoonshineEncoder : BaseModel

- (NSArray *)encode:(NSArray *)waveform;

@end

#endif /* MoonshineEncoder_hpp */
