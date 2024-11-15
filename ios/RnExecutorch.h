#import <React/RCTBridgeModule.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <RnExecutorchSpec/RnExecutorchSpec.h>
#endif

@interface RnExecutorch: NSObject <RCTBridgeModule>

@end

#ifdef RCT_NEW_ARCH_ENABLED
@interface RnExecutorch () <NativeRnExecutorchSpec>

@end
#endif