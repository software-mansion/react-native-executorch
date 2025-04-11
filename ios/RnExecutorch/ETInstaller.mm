#import "ETInstaller.h"

#import <React/RCTBridge+Private.h>

#import <React/RCTCallInvoker.h>
#import <ReactCommon/RCTTurboModule.h>
#include <RnExecutorchInstaller.h>

using namespace facebook::react;

@interface RCTBridge (JSIRuntime)
- (void *)runtime;
@end

@implementation ETInstaller

@synthesize callInvoker = _callInvoker;

RCT_EXPORT_MODULE(ETInstaller);

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(install) {
  auto jsiRuntime =
      reinterpret_cast<facebook::jsi::Runtime *>(self.bridge.runtime);
  auto jsCallInvoker = _callInvoker.callInvoker;

  assert(jsiRuntime != nullptr);

  rnexecutorch::RnExecutorchInstaller::injectJSIBindings(jsiRuntime,
                                                         jsCallInvoker);

  NSLog(@"Successfully installed JSI bindings for react-native-executorch!");
  return @true;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeETInstallerSpecJSI>(params);
}

@end
