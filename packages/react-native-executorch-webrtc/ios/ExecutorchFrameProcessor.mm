#import "ExecutorchFrameProcessor.h"
#import <CoreImage/CoreImage.h>
#import <CoreVideo/CoreVideo.h>
#import <WebRTC/RTCCVPixelBuffer.h>
#import <WebRTC/RTCI420Buffer.h>
#import <WebRTC/RTCYUVPlanarBuffer.h>

#import <opencv2/opencv.hpp>
#import <rnexecutorch/host_objects/JSTensorViewIn.h>
#import <rnexecutorch/models/semantic_segmentation/BaseSemanticSegmentation.h>

#include <memory>
#include <mutex>

using namespace rnexecutorch;
using namespace rnexecutorch::models::semantic_segmentation;

namespace {
// Bundles the segmentation instance with the dims read from it. Held by
// shared_ptr so an in-flight processFrame keeps the model alive even if
// unloadModel runs concurrently — load happens on a background queue (see
// configureWithModelPath), processing happens on the capture queue, and
// unloadModel is reachable from the public API. The mutex publishes
// load->process atomically; the shared_ptr snapshot pins lifetime across the
// long generateFromPixels call.
struct LoadedModel {
  std::unique_ptr<BaseSemanticSegmentation> segmentation;
  int modelWidth = 256;
  int modelHeight = 256;
};
} // namespace

@implementation ExecutorchFrameProcessor {
  // ExecuTorch model — null when not loaded. Always read/written under
  // _modelMutex; readers snapshot to a local shared_ptr to pin lifetime.
  std::shared_ptr<LoadedModel> _loadedModel;
  std::mutex _modelMutex;

  // Core Image context for GPU-accelerated processing
  CIContext *_ciContext;
  float _blurRadius;

  // Pixel buffer pool for efficient output allocation
  CVPixelBufferPoolRef _outputPool;
  size_t _poolWidth;
  size_t _poolHeight;

  // Frame dropping
  RTCVideoFrame *_lastProcessedFrame;
  BOOL _isProcessing;

  // Temporal smoothing (EMA)
  cv::Mat _previousMask;
  float _emaAlpha;

  // Timing
  int _frameCount;
  NSTimeInterval _lastLogTime;
  NSTimeInterval _totalProcessingTime;
}

+ (instancetype)sharedInstance {
  static ExecutorchFrameProcessor *instance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    instance = [[ExecutorchFrameProcessor alloc] init];
  });
  return instance;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _blurRadius = 12.0f;
    _isProcessing = NO;
    _emaAlpha = 0.5f;
    _frameCount = 0;
    _lastLogTime = 0;
    _totalProcessingTime = 0;

    // Create Core Image context with GPU rendering
    _ciContext = [CIContext contextWithOptions:@{
      kCIContextUseSoftwareRenderer : @NO,
    }];
  }
  return self;
}

- (void)configureWithModelPath:(NSString *)modelPath {
  NSLog(@"[ExecutorchFrameProcessor] Loading model from: %@", modelPath);

  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
    @try {
      std::vector<float> normMean = {};
      std::vector<float> normStd = {};
      std::vector<std::string> allClasses = {"foreground", "background"};

      auto loaded = std::make_shared<LoadedModel>();
      loaded->segmentation = std::make_unique<BaseSemanticSegmentation>(
          std::string([modelPath UTF8String]), normMean, normStd, allClasses,
          nullptr);

      auto inputShapes = loaded->segmentation->getAllInputShapes();
      if (!inputShapes.empty() && inputShapes[0].size() >= 4) {
        loaded->modelHeight = inputShapes[0][inputShapes[0].size() - 2];
        loaded->modelWidth = inputShapes[0][inputShapes[0].size() - 1];
      }

      {
        std::lock_guard<std::mutex> lock(self->_modelMutex);
        self->_loadedModel = std::move(loaded);
      }
      NSLog(@"[ExecutorchFrameProcessor] Model loaded!");
    } @catch (NSException *exception) {
      NSLog(@"[ExecutorchFrameProcessor] Failed to load model: %@",
            exception.reason);
    }
  });
}

- (void)setBlurRadius:(float)blurRadius {
  _blurRadius = blurRadius;
}

- (void)unloadModel {
  // Drop the publication ref. Any in-flight processFrame holds its own
  // shared_ptr snapshot and will keep the segmentation alive until it
  // returns, then release it.
  {
    std::lock_guard<std::mutex> lock(_modelMutex);
    _loadedModel.reset();
  }
  _previousMask.release();

  // Release cached frame
  _lastProcessedFrame = nil;

  // Release pixel buffer pool
  if (_outputPool) {
    CVPixelBufferPoolRelease(_outputPool);
    _outputPool = NULL;
    _poolWidth = 0;
    _poolHeight = 0;
  }

  NSLog(@"[ExecutorchFrameProcessor] Model unloaded and resources released");
}

- (BOOL)isAvailable {
  return YES;
}

#pragma mark - VideoFrameProcessorDelegate

- (RTCVideoFrame *)capturer:(RTCVideoCapturer *)capturer
       didCaptureVideoFrame:(RTCVideoFrame *)frame {
  {
    std::lock_guard<std::mutex> lock(_modelMutex);
    if (!_loadedModel) {
      return frame;
    }
  }

  // Frame dropping when busy
  if (_isProcessing) {
    return _lastProcessedFrame ?: frame;
  }

  _isProcessing = YES;
  RTCVideoFrame *result = nil;
  @try {
    result = [self processFrame:frame];
  } @catch (NSException *e) {
    // Swallow so _isProcessing always resets below; one bad frame won't lock
    // the pipeline.
  }
  _isProcessing = NO;
  if (!result) {
    return _lastProcessedFrame ?: frame;
  }
  _lastProcessedFrame = result;
  return result;
}

#pragma mark - Core Pipeline

- (RTCVideoFrame *)processFrame:(RTCVideoFrame *)frame {
  NSTimeInterval startTime = [[NSDate date] timeIntervalSince1970];

  // Get CVPixelBuffer from frame
  CVPixelBufferRef inputPixelBuffer = NULL;

  if ([frame.buffer isKindOfClass:[RTCCVPixelBuffer class]]) {
    inputPixelBuffer = ((RTCCVPixelBuffer *)frame.buffer).pixelBuffer;
  } else {
    // Convert I420 to CVPixelBuffer if needed
    inputPixelBuffer = [self createPixelBufferFromI420:frame.buffer];
    if (!inputPixelBuffer) {
      return frame;
    }
  }

  size_t width = CVPixelBufferGetWidth(inputPixelBuffer);
  size_t height = CVPixelBufferGetHeight(inputPixelBuffer);

  // Run ExecuTorch segmentation to get mask
  CIImage *maskImage = [self generateMaskForPixelBuffer:inputPixelBuffer
                                               rotation:frame.rotation];
  if (!maskImage) {
    if (![frame.buffer isKindOfClass:[RTCCVPixelBuffer class]]) {
      CVPixelBufferRelease(inputPixelBuffer);
    }
    return frame;
  }

  // Ensure output pool exists
  [self ensurePoolForWidth:width height:height];

  // Create output buffer
  CVPixelBufferRef outputBuffer = NULL;
  if (CVPixelBufferPoolCreatePixelBuffer(kCFAllocatorDefault, _outputPool,
                                         &outputBuffer) != kCVReturnSuccess) {
    if (![frame.buffer isKindOfClass:[RTCCVPixelBuffer class]]) {
      CVPixelBufferRelease(inputPixelBuffer);
    }
    return frame;
  }

  // Core Image processing
  CIImage *original = [CIImage imageWithCVPixelBuffer:inputPixelBuffer];

  // Scale mask to match input size
  CGFloat scaleX = (CGFloat)width / maskImage.extent.size.width;
  CGFloat scaleY = (CGFloat)height / maskImage.extent.size.height;
  CIImage *scaledMask = [maskImage
      imageByApplyingTransform:CGAffineTransformMakeScale(scaleX, scaleY)];

  // Apply Gaussian blur to background
  CIFilter *blurFilter = [CIFilter filterWithName:@"CIGaussianBlur"];
  [blurFilter setValue:[original imageByClampingToExtent]
                forKey:kCIInputImageKey];
  [blurFilter setValue:@(_blurRadius) forKey:kCIInputRadiusKey];
  CIImage *blurred =
      [blurFilter.outputImage imageByCroppingToRect:original.extent];

  // Blend: foreground (mask=white) stays sharp, background gets blurred
  CIFilter *blendFilter = [CIFilter filterWithName:@"CIBlendWithMask"];
  [blendFilter setValue:original forKey:kCIInputImageKey];
  [blendFilter setValue:blurred forKey:kCIInputBackgroundImageKey];
  [blendFilter setValue:scaledMask forKey:kCIInputMaskImageKey];
  CIImage *composited = blendFilter.outputImage;

  // Render to output buffer
  CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
  [_ciContext render:composited
      toCVPixelBuffer:outputBuffer
               bounds:original.extent
           colorSpace:colorSpace];
  CGColorSpaceRelease(colorSpace);

  // Create output frame
  RTCCVPixelBuffer *rtcBuffer =
      [[RTCCVPixelBuffer alloc] initWithPixelBuffer:outputBuffer];
  RTCVideoFrame *outputFrame =
      [[RTCVideoFrame alloc] initWithBuffer:rtcBuffer
                                   rotation:frame.rotation
                                timeStampNs:frame.timeStampNs];

  CVPixelBufferRelease(outputBuffer);
  if (![frame.buffer isKindOfClass:[RTCCVPixelBuffer class]]) {
    CVPixelBufferRelease(inputPixelBuffer);
  }

  // Logging
  NSTimeInterval endTime = [[NSDate date] timeIntervalSince1970];
  _totalProcessingTime += (endTime - startTime);
  _frameCount++;

  if (endTime - _lastLogTime > 1.0) {
    double avgMs = (_totalProcessingTime / _frameCount) * 1000.0;
    double fps = _frameCount / (endTime - _lastLogTime);
    NSLog(@"[ExecutorchFrameProcessor] Avg: %.1fms (%.1f FPS)", avgMs, fps);
    _lastLogTime = endTime;
    _frameCount = 0;
    _totalProcessingTime = 0;
  }

  return outputFrame;
}

#pragma mark - Segmentation

- (CIImage *)generateMaskForPixelBuffer:(CVPixelBufferRef)pixelBuffer
                               rotation:(RTCVideoRotation)rotation {
  // Snapshot under the mutex so unloadModel can't free the segmentation
  // mid-call — the local shared_ptr pins lifetime through generateFromPixels.
  std::shared_ptr<LoadedModel> model;
  {
    std::lock_guard<std::mutex> lock(_modelMutex);
    model = _loadedModel;
  }
  if (!model) {
    return nil;
  }

  size_t width = CVPixelBufferGetWidth(pixelBuffer);
  size_t height = CVPixelBufferGetHeight(pixelBuffer);

  // Lock pixel buffer and convert to RGB for model
  CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);

  OSType format = CVPixelBufferGetPixelFormatType(pixelBuffer);
  cv::Mat rgbMat;

  if (format == kCVPixelFormatType_32BGRA) {
    // Direct BGRA access
    void *baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer);
    size_t bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);
    cv::Mat bgraMat((int)height, (int)width, CV_8UC4, baseAddress, bytesPerRow);
    cv::cvtColor(bgraMat, rgbMat, cv::COLOR_BGRA2RGB);
  } else if (format == kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange ||
             format == kCVPixelFormatType_420YpCbCr8BiPlanarFullRange) {
    // NV12 format - convert via I420
    cv::Mat yMat((int)height, (int)width, CV_8UC1,
                 CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 0),
                 CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 0));
    cv::Mat uvMat((int)height / 2, (int)width / 2, CV_8UC2,
                  CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 1),
                  CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 1));

    cv::Mat yuvMat((int)height * 3 / 2, (int)width, CV_8UC1);
    yMat.copyTo(yuvMat(cv::Rect(0, 0, (int)width, (int)height)));

    // Deinterleave UV
    std::vector<cv::Mat> uvChannels;
    cv::split(uvMat, uvChannels);
    uvChannels[0].copyTo(
        yuvMat(cv::Rect(0, (int)height, (int)width / 2, (int)height / 2)));
    uvChannels[1].copyTo(yuvMat(cv::Rect((int)width / 2, (int)height,
                                         (int)width / 2, (int)height / 2)));

    cv::cvtColor(yuvMat, rgbMat, cv::COLOR_YUV2RGB_I420);
  } else {
    CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
    return nil;
  }

  CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);

  // Rotate for model inference
  cv::Mat rgbRotated;
  if (rotation == RTCVideoRotation_90) {
    cv::rotate(rgbMat, rgbRotated, cv::ROTATE_90_CLOCKWISE);
  } else if (rotation == RTCVideoRotation_180) {
    cv::rotate(rgbMat, rgbRotated, cv::ROTATE_180);
  } else if (rotation == RTCVideoRotation_270) {
    cv::rotate(rgbMat, rgbRotated, cv::ROTATE_90_COUNTERCLOCKWISE);
  } else {
    rgbRotated = rgbMat;
  }

  // Run ExecuTorch segmentation
  cv::Mat mask;
  try {
    JSTensorViewIn pixelData;
    pixelData.dataPtr = rgbRotated.data;
    pixelData.sizes = {rgbRotated.rows, rgbRotated.cols, 3};
    pixelData.scalarType = executorch::aten::ScalarType::Byte;

    std::set<std::string, std::less<>> classesOfInterest = {"foreground"};
    auto result = model->segmentation->generateFromPixels(
        pixelData, classesOfInterest, false);

    if (result.classBuffers && result.classBuffers->count("foreground")) {
      auto &fgBuffer = result.classBuffers->at("foreground");
      auto *fgData = reinterpret_cast<float *>(fgBuffer->data());
      mask = cv::Mat(model->modelHeight, model->modelWidth, CV_32FC1, fgData)
                 .clone();
    } else {
      return nil;
    }
  } catch (const std::exception &e) {
    NSLog(@"[ExecutorchFrameProcessor] Segmentation failed: %s", e.what());
    return nil;
  }

  // Rotate mask back
  cv::Mat maskRotated;
  if (rotation == RTCVideoRotation_90) {
    cv::rotate(mask, maskRotated, cv::ROTATE_90_COUNTERCLOCKWISE);
  } else if (rotation == RTCVideoRotation_180) {
    cv::rotate(mask, maskRotated, cv::ROTATE_180);
  } else if (rotation == RTCVideoRotation_270) {
    cv::rotate(mask, maskRotated, cv::ROTATE_90_CLOCKWISE);
  } else {
    maskRotated = mask;
  }

  // EMA temporal smoothing to reduce flickering
  if (_previousMask.empty() || _previousMask.size() != maskRotated.size()) {
    _previousMask = maskRotated.clone();
  } else {
    // Blend current mask with previous: smoothed = alpha * current + (1 -
    // alpha) * previous
    cv::addWeighted(maskRotated, _emaAlpha, _previousMask, 1.0f - _emaAlpha, 0,
                    maskRotated);
    _previousMask = maskRotated.clone();
  }

  // Morphological operations to clean up mask edges
  cv::Mat kernel = cv::getStructuringElement(cv::MORPH_RECT, cv::Size(3, 3));
  cv::erode(maskRotated, maskRotated, kernel, cv::Point(-1, -1), 1);
  cv::dilate(maskRotated, maskRotated, kernel, cv::Point(-1, -1), 1);

  // Match Android's mask softness — Android applies two GPU mask-blur passes
  // at sigma 5 (effective sigma ~ 5*sqrt(2)). One OpenCV pass at sigma 7 gets
  // close enough on iOS without an extra round trip.
  cv::GaussianBlur(maskRotated, maskRotated, cv::Size(0, 0), 7.0);

  // Convert to 8-bit grayscale
  cv::Mat mask8u;
  maskRotated.convertTo(mask8u, CV_8UC1, 255.0);

  // Create CIImage from mask
  CVPixelBufferRef maskPixelBuffer = [self createGrayscalePixelBuffer:mask8u];
  if (!maskPixelBuffer) {
    return nil;
  }

  CIImage *maskCIImage = [CIImage imageWithCVPixelBuffer:maskPixelBuffer];
  CVPixelBufferRelease(maskPixelBuffer);

  return maskCIImage;
}

#pragma mark - Helpers

- (CVPixelBufferRef)createPixelBufferFromI420:(id<RTCVideoFrameBuffer>)buffer {
  id<RTCI420Buffer> i420 = [buffer toI420];
  if (!i420) {
    return NULL;
  }

  int width = [i420 width];
  int height = [i420 height];
  int strideY = [i420 strideY];
  int strideU = [i420 strideU];
  int strideV = [i420 strideV];
  const uint8_t *dataY = [i420 dataY];
  const uint8_t *dataU = [i420 dataU];
  const uint8_t *dataV = [i420 dataV];

  NSDictionary *attrs = @{
    (id)kCVPixelBufferPixelFormatTypeKey : @(kCVPixelFormatType_32BGRA),
    (id)kCVPixelBufferWidthKey : @(width),
    (id)kCVPixelBufferHeightKey : @(height),
    (id)kCVPixelBufferIOSurfacePropertiesKey : @{},
  };

  CVPixelBufferRef pixelBuffer = NULL;
  CVReturn result = CVPixelBufferCreate(
      kCFAllocatorDefault, width, height, kCVPixelFormatType_32BGRA,
      (__bridge CFDictionaryRef)attrs, &pixelBuffer);
  if (result != kCVReturnSuccess) {
    return NULL;
  }

  // Convert I420 to BGRA using OpenCV
  cv::Mat i420Mat(height * 3 / 2, width, CV_8UC1);

  // Copy Y plane
  for (int row = 0; row < height; row++) {
    memcpy(i420Mat.ptr(row), dataY + row * strideY, width);
  }

  // Copy U and V planes
  uint8_t *uvDst = i420Mat.data + (height * width);
  int uvHeight = height / 2;
  int uvWidth = width / 2;
  for (int row = 0; row < uvHeight; row++) {
    memcpy(uvDst + row * uvWidth, dataU + row * strideU, uvWidth);
  }
  for (int row = 0; row < uvHeight; row++) {
    memcpy(uvDst + uvHeight * uvWidth + row * uvWidth, dataV + row * strideV,
           uvWidth);
  }

  cv::Mat bgraMat;
  cv::cvtColor(i420Mat, bgraMat, cv::COLOR_YUV2BGRA_I420);

  CVPixelBufferLockBaseAddress(pixelBuffer, 0);
  void *dst = CVPixelBufferGetBaseAddress(pixelBuffer);
  size_t dstBytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);

  for (int row = 0; row < height; row++) {
    memcpy((uint8_t *)dst + row * dstBytesPerRow, bgraMat.ptr(row), width * 4);
  }

  CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);
  return pixelBuffer;
}

- (CVPixelBufferRef)createGrayscalePixelBuffer:(cv::Mat &)grayMat {
  int width = grayMat.cols;
  int height = grayMat.rows;

  NSDictionary *attrs = @{
    (id)kCVPixelBufferPixelFormatTypeKey : @(kCVPixelFormatType_OneComponent8),
    (id)kCVPixelBufferWidthKey : @(width),
    (id)kCVPixelBufferHeightKey : @(height),
    (id)kCVPixelBufferIOSurfacePropertiesKey : @{},
  };

  CVPixelBufferRef pixelBuffer = NULL;
  CVReturn result = CVPixelBufferCreate(
      kCFAllocatorDefault, width, height, kCVPixelFormatType_OneComponent8,
      (__bridge CFDictionaryRef)attrs, &pixelBuffer);
  if (result != kCVReturnSuccess) {
    return NULL;
  }

  CVPixelBufferLockBaseAddress(pixelBuffer, 0);
  void *dst = CVPixelBufferGetBaseAddress(pixelBuffer);
  size_t dstBytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);

  for (int row = 0; row < height; row++) {
    memcpy((uint8_t *)dst + row * dstBytesPerRow, grayMat.ptr(row), width);
  }

  CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);
  return pixelBuffer;
}

- (void)ensurePoolForWidth:(size_t)width height:(size_t)height {
  if (_poolWidth == width && _poolHeight == height && _outputPool) {
    return;
  }

  if (_outputPool) {
    CVPixelBufferPoolRelease(_outputPool);
    _outputPool = NULL;
  }

  _poolWidth = width;
  _poolHeight = height;

  NSDictionary *attrs = @{
    (id)kCVPixelBufferPixelFormatTypeKey : @(kCVPixelFormatType_32BGRA),
    (id)kCVPixelBufferWidthKey : @(width),
    (id)kCVPixelBufferHeightKey : @(height),
    (id)kCVPixelBufferIOSurfacePropertiesKey : @{},
    (id)kCVPixelBufferMetalCompatibilityKey : @YES,
  };

  CVPixelBufferPoolCreate(kCFAllocatorDefault, NULL,
                          (__bridge CFDictionaryRef)attrs, &_outputPool);
}

- (void)dealloc {
  if (_outputPool) {
    CVPixelBufferPoolRelease(_outputPool);
  }
}

@end
