#import "ExecutorchWebRTC.h"
#import "ExecutorchFrameProcessor.h"
#include "ProcessorProvider.h"

@implementation ExecutorchWebRTC

RCT_EXPORT_MODULE()

static ExecutorchFrameProcessor *_processor = nil;
static dispatch_once_t _registerOnce;
static NSString *const PROCESSOR_NAME = @"executorchBackgroundBlur";

+ (void)ensureRegistered {
  dispatch_once(&_registerOnce, ^{
    _processor = [[ExecutorchFrameProcessor alloc] init];
    [ProcessorProvider addProcessor:_processor forName:PROCESSOR_NAME];
    NSLog(@"[ExecutorchWebRTC] Registered %@ processor", PROCESSOR_NAME);
  });
}

#pragma mark - Fishjam-compatible API

RCT_EXPORT_METHOD(initialize : (NSString *)modelPath) {
  NSLog(@"[ExecutorchWebRTC] initialize: %@", modelPath);
  [ExecutorchWebRTC ensureRegistered];

  NSString *cleanPath = modelPath;
  if ([modelPath hasPrefix:@"file://"]) {
    cleanPath = [modelPath substringFromIndex:7];
  }
  [_processor configureWithModelPath:cleanPath];
}

RCT_EXPORT_METHOD(deinitialize) {
  NSLog(@"[ExecutorchWebRTC] deinitialize");
  [_processor unloadModel];
}

RCT_EXPORT_METHOD(setBlurRadius : (double)radius) {
  [_processor setBlurRadius:(float)radius];
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(isAvailable) { return @YES; }

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getProcessorName) {
  return PROCESSOR_NAME;
}

#pragma mark - Legacy API (for backward compatibility)

RCT_EXPORT_METHOD(setup) { [ExecutorchWebRTC ensureRegistered]; }

RCT_EXPORT_METHOD(configureBackgroundRemoval : (NSString *)modelPath) {
  [self initialize:modelPath];
}

RCT_EXPORT_METHOD(configureBackgroundBlur : (NSString *)
                      modelPath blurIntensity : (int)intensity) {
  [self initialize:modelPath];
  [self setBlurRadius:intensity];
}

@end
