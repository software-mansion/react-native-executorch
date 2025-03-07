#ifndef WhisperDecoder_hpp
#define WhisperDecoder_hpp

#import "../BaseModel.h"
#import "ExecutorchLib/ETModel.h"
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface WhisperDecoder : BaseModel

- (NSArray *)decode:(NSArray *)prevTokens
    encoderLastHiddenState:(NSArray *)encoderLastHiddenState;

@end

#endif /* WhisperDecoder_hpp */
