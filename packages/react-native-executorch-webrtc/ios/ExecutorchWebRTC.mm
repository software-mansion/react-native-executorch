#import "ExecutorchWebRTC.h"
#import "ExecutorchFrameProcessor.h"
#import <react-native-webrtc/ProcessorProvider.h>

@implementation ExecutorchWebRTC

RCT_EXPORT_MODULE()

static BOOL _processorRegistered = NO;

+ (void)registerProcessorIfNeeded {
  if (!_processorRegistered) {
    _processorRegistered = YES;
    ExecutorchFrameProcessor *processor =
        [ExecutorchFrameProcessor sharedInstance];
    [ProcessorProvider addProcessor:processor
                            forName:@"executorchBackgroundBlur"];
    NSLog(@"[ExecutorchWebRTC] Registered executorchBackgroundBlur processor");
  }
}

RCT_EXPORT_METHOD(setup) { [ExecutorchWebRTC registerProcessorIfNeeded]; }

RCT_EXPORT_METHOD(configureBackgroundRemoval : (NSString *)modelPath) {
  NSLog(@"[ExecutorchWebRTC] configureBackgroundRemoval: %@", modelPath);

  [ExecutorchWebRTC registerProcessorIfNeeded];

  // Remove file:// prefix if present
  NSString *cleanPath = modelPath;
  if ([modelPath hasPrefix:@"file://"]) {
    cleanPath = [modelPath substringFromIndex:7];
  }

  [[ExecutorchFrameProcessor sharedInstance] configureWithModelPath:cleanPath];
}

RCT_EXPORT_METHOD(configureBackgroundBlur : (NSString *)
                      modelPath blurIntensity : (int)intensity) {
  // Legacy alias
  [self configureBackgroundRemoval:modelPath];
}

@end
