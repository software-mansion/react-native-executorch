#import "ExecutorchWebRTC.h"
#import "ExecutorchFrameProcessor.h"
#include "ProcessorProvider.h"

@implementation ExecutorchWebRTC

RCT_EXPORT_MODULE()

static BOOL _processorRegistered = NO;
static NSString *const PROCESSOR_NAME = @"executorchBackgroundBlur";

+ (void)registerProcessorIfNeeded {
  if (!_processorRegistered) {
    _processorRegistered = YES;
    ExecutorchFrameProcessor *processor =
        [ExecutorchFrameProcessor sharedInstance];
    [ProcessorProvider addProcessor:processor forName:PROCESSOR_NAME];
    NSLog(@"[ExecutorchWebRTC] Registered %@ processor", PROCESSOR_NAME);
  }
}

#pragma mark - Fishjam-compatible API

RCT_EXPORT_METHOD(initialize : (NSString *)modelPath) {
  NSLog(@"[ExecutorchWebRTC] initialize: %@", modelPath);

  [ExecutorchWebRTC registerProcessorIfNeeded];

  // Remove file:// prefix if present
  NSString *cleanPath = modelPath;
  if ([modelPath hasPrefix:@"file://"]) {
    cleanPath = [modelPath substringFromIndex:7];
  }

  [[ExecutorchFrameProcessor sharedInstance] configureWithModelPath:cleanPath];
}

RCT_EXPORT_METHOD(deinitialize) {
  NSLog(@"[ExecutorchWebRTC] deinitialize");
  [[ExecutorchFrameProcessor sharedInstance] unloadModel];
}

RCT_EXPORT_METHOD(setBlurRadius : (double)radius) {
  [[ExecutorchFrameProcessor sharedInstance] setBlurRadius:(float)radius];
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(isAvailable) {
  return @([[ExecutorchFrameProcessor sharedInstance] isAvailable]);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getProcessorName) {
  return PROCESSOR_NAME;
}

#pragma mark - Legacy API (for backward compatibility)

RCT_EXPORT_METHOD(setup) { [ExecutorchWebRTC registerProcessorIfNeeded]; }

RCT_EXPORT_METHOD(configureBackgroundRemoval : (NSString *)modelPath) {
  [self initialize:modelPath];
}

RCT_EXPORT_METHOD(configureBackgroundBlur : (NSString *)
                      modelPath blurIntensity : (int)intensity) {
  [self initialize:modelPath];
  [self setBlurRadius:intensity];
}

@end
