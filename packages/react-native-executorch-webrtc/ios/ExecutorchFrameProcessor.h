#import <Foundation/Foundation.h>
#import <WebRTC/RTCVideoCapturer.h>
#import <WebRTC/RTCVideoFrame.h>

// Import the VideoFrameProcessor protocol from react-native-webrtc
@protocol VideoFrameProcessorDelegate
- (RTCVideoFrame *)capturer:(RTCVideoCapturer *)capturer
       didCaptureVideoFrame:(RTCVideoFrame *)frame;
@end

@interface ExecutorchFrameProcessor : NSObject <VideoFrameProcessorDelegate>

+ (instancetype)sharedInstance;
- (void)configureWithModelPath:(NSString *)modelPath;
- (void)unloadModel;

@end
