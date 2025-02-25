#ifndef Moonshine_hpp
#define Moonshine_hpp

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "MoonshineEncoder.hpp"
#import "Moonshinedecoder.hpp"

@interface Moonshine : NSObject

- (NSArray *)encode:(NSArray *)waveform;
- (NSArray *)decode:(NSArray *)prevTokens encoderLastHiddenState:(NSArray *)encoderLastHiddenState;
- (void)loadModules:(NSString[] *)modelSources;

@end



#endif /* Moonshine_hpp */
