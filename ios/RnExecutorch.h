#ifdef __cplusplus
#import "react-native-executorch.h"
#endif

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "RNExecutorchSpec.h"

@interface RnExecutorch : RCTEventEmitter <NativeRnExecutorchSpec>

@end
#else

@interface RnExecutorch: RCTEventEmitter <RCTBridgeModule>

@end

#endif