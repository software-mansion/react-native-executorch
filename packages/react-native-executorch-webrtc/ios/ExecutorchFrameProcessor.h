#import <Foundation/Foundation.h>
#import <WebRTC/RTCVideoCapturer.h>
#import <WebRTC/RTCVideoFrame.h>

@protocol VideoFrameProcessorDelegate
- (RTCVideoFrame *)capturer:(RTCVideoCapturer *)capturer
       didCaptureVideoFrame:(RTCVideoFrame *)frame;
@end

@interface ExecutorchFrameProcessor : NSObject <VideoFrameProcessorDelegate>

+ (instancetype)sharedInstance;

- (void)configureWithModelPath:(NSString *)modelPath;
- (void)setBlurRadius:(float)blurRadius;
- (void)unloadModel;
- (BOOL)isAvailable;

@end
