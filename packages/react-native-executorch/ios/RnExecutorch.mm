#import "RnExecutorch.h"
#import "../cpp/RnExecutorch.h"
#import <React/RCTBridge+Private.h>
#import <jsi/jsi.h>

@implementation RnExecutorch
RCT_EXPORT_MODULE()

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeRnExecutorchSpecJSI>(params);
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, install) {
    RCTBridge *bridge = [RCTBridge currentBridge];
    RCTCxxBridge *cxxBridge = (RCTCxxBridge *)bridge;

    if (cxxBridge == nil)
        return @NO;

    facebook::jsi::Runtime *jsiRuntime = (facebook::jsi::Runtime *)cxxBridge.runtime;

    if (jsiRuntime == nil)
        return @NO;

    rnexecutorch::install(*jsiRuntime);

    return @YES;
}

@end
