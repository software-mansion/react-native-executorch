
#ifdef RCT_NEW_ARCH_ENABLED
#import "RNRnExecutorchSpec.h"

@interface RnExecutorch : NSObject <NativeRnExecutorchSpec>
#else
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RnExecutorch : RCTEventEmitter <RCTBridgeModule>
#endif

@end
