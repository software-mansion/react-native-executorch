#import "ETInstaller.h"

#import <React/RCTBridge+Private.h>

#import <React/RCTCallInvoker.h>
#import <ReactCommon/RCTTurboModule.h>
#include <rnexecutorch/RnExecutorchInstaller.h>
#include <stdexcept>

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

  auto fetchUrl = [](std::string url) {
    @try {
      NSString *nsUrlStr =
          [NSString stringWithCString:url.c_str()
                             encoding:[NSString defaultCStringEncoding]];
      NSURL *nsUrl = [NSURL URLWithString:nsUrlStr];
      NSData *data = [NSData dataWithContentsOfURL:nsUrl];
      const std::byte *bytePtr =
          reinterpret_cast<const std::byte *>(data.bytes);
      int bufferLength = [data length];
      return std::vector<std::byte>(bytePtr, bytePtr + bufferLength);
    } @catch (NSException *exception) {
      throw std::runtime_error("Error fetching data from a url");
    }
  };
  rnexecutorch::RnExecutorchInstaller::injectJSIBindings(
      jsiRuntime, jsCallInvoker, fetchUrl);

  NSLog(@"Successfully installed JSI bindings for react-native-executorch!");
  return @true;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeETInstallerSpecJSI>(params);
}

@end
