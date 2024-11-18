#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <RnExecutorchSpec/RnExecutorchSpec.h>
#endif

#ifdef RCT_NEW_ARCH_ENABLED
@interface RnExecutorch : RCTEventEmitter <NativeRnExecutorchSpec>

@end
#else

@interface RnExecutorch: RCTEventEmitter <RCTBridgeModule>

@end

#endif