#ifndef WhisperEncoder_hpp
#define WhisperEncoder_hpp

#import "../BaseModel.h"
#import "ExecutorchLib/ETModel.h"
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface WhisperEncoder : BaseModel

- (NSArray *)encode:(NSArray *)waveform;

@end

#endif /* WhisperEncoder_hpp */
