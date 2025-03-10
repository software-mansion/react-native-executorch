#ifndef MoonshineDecoder_hpp
#define MoonshineDecoder_hpp

#import "../BaseModel.h"
#import "ExecutorchLib/ETModel.h"
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface MoonshineDecoder : BaseModel

- (NSArray *)decode:(NSArray *)prevTokens
    encoderLastHiddenState:(NSArray *)encoderLastHiddenState;

@end

#endif /* MoonshineDecoder_hpp */
