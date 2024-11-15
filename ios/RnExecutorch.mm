#import "RnExecutorch.h"

#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/RCTTurboModule.h>

#import <react/renderer/uimanager/primitives.h>

@implementation RnExecutorch
RCT_EXPORT_MODULE()

- (NSNumber *)multiply:(double)a b:(double)b
{
    return [[NSNumber alloc] initWithDouble:a * b];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeRnExecutorchSpecJSI>(params);
}

@end
