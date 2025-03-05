#ifndef SpeechToTextBaseModel_hpp
#define SpeechToTextBaseModel_hpp

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "../BaseModel.h"
@interface SpeechToTextBaseModel : NSObject{
@public
  NSNumber *START_TOKEN;
  NSNumber *EOS_TOKEN;
  int maxSeqLen;
  int fftSize;
}

- (NSArray *)encode:(NSArray *)waveform;
- (NSArray *)decode:(NSArray *)prevTokens encoderLastHiddenState:(NSArray *)encoderLastHiddenState;
- (void)loadModules:(NSArray *)modelSources;
- (void)loadModuleHelper:(id)model
       withSource:(NSString *)source
        onSuccess:(void (^)(void))success
        onFailure:(void (^)(NSString *))failure;

@end



#endif /* SpeechToTextBaseModel_hpp */
