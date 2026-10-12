#import "RnExecutorch.h"
#import "../cpp/RnExecutorch.h"
#import <ReactCommon/RCTTurboModuleWithJSIBindings.h>
#import <jsi/jsi.h>

@interface RnExecutorch () <RCTTurboModuleWithJSIBindings>
@end

@implementation RnExecutorch {
    BOOL _installed;
}

RCT_EXPORT_MODULE()

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeRnExecutorchSpecJSI>(params);
}

// The TurboModule manager calls this on the JS thread when the module is first
// required, so the bindings exist before JS calls `install()`. RCTCxxBridge,
// the previous route to the runtime, was removed in RN 0.87.
- (void)installJSIBindingsWithRuntime:(facebook::jsi::Runtime &)runtime
                          callInvoker:(const std::shared_ptr<facebook::react::CallInvoker> &)callInvoker {
    rnexecutorch::install(runtime);
    _installed = YES;
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, install) {
    return @(_installed);
}

@end
