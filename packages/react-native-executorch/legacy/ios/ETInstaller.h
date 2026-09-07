#import <React/RCTCallInvokerModule.h>
#import <React/RCTEventEmitter.h>
#import <RnExecutorchSpec/RnExecutorchSpec.h>

@interface ETInstaller
    : RCTEventEmitter <NativeETInstallerSpec, RCTCallInvokerModule>

@end
