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
constexpr float EMA_ALPHA = 0.5f;
} // namespace

@implementation ExecutorchFrameProcessor {
  std::mutex _mutex;

  // All fields below should be guarded by _mutex.
  std::unique_ptr<BaseSemanticSegmentation> _segmentation;
  int _modelWidth;
  int _modelHeight;
  cv::Mat _previousMask;
  CVPixelBufferPoolRef _outputPool;
  size_t _poolWidth;
  size_t _poolHeight;
  RTCVideoFrame *_lastProcessedFrame;
  float _blurRadius;

  // Set in init, never reassigned.
  CIContext *_ciContext;

  // Touched only from the capture thread inside processFrameLocked.
  int _frameCount;
  NSTimeInterval _lastLogTime;
  NSTimeInterval _totalProcessingTime;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _modelWidth = 256;
    _modelHeight = 256;
    _blurRadius = 12.0f;
    _outputPool = NULL;
    _ciContext = [CIContext contextWithOptions:@{
      kCIContextUseSoftwareRenderer : @NO,
    }];
  }
  return self;
}

- (void)dealloc {
  if (_outputPool) {
    CVPixelBufferPoolRelease(_outputPool);
  }
}

- (void)configureWithModelPath:(NSString *)modelPath {
  NSLog(@"[ExecutorchFrameProcessor] Loading model from: %@", modelPath);

  std::unique_ptr<BaseSemanticSegmentation> seg;
  int w = 256;
  int h = 256;
  try {
    std::vector<float> normMean = {};
    std::vector<float> normStd = {};
    std::vector<std::string> allClasses = {"foreground", "background"};
    seg = std::make_unique<BaseSemanticSegmentation>(
        std::string([modelPath UTF8String]), normMean, normStd, allClasses,
        nullptr);
    auto inputShapes = seg->getAllInputShapes();
    if (!inputShapes.empty() && inputShapes[0].size() >= 4) {
      h = inputShapes[0][inputShapes[0].size() - 2];
      w = inputShapes[0][inputShapes[0].size() - 1];
    }
  } catch (const std::exception &e) {
    NSLog(@"[ExecutorchFrameProcessor] Failed to load model: %s", e.what());
    return;
  }

  {
    std::lock_guard<std::mutex> lock(_mutex);
    _segmentation = std::move(seg);
    _modelWidth = w;
    _modelHeight = h;
    _previousMask.release();
  }
  NSLog(@"[ExecutorchFrameProcessor] Model loaded!");
}

- (void)setBlurRadius:(float)blurRadius {
  std::lock_guard<std::mutex> lock(_mutex);
  _blurRadius = blurRadius;
}

- (void)unloadModel {
  CVPixelBufferPoolRef poolToRelease = NULL;
  {
    std::lock_guard<std::mutex> lock(_mutex);
    _segmentation.reset();
    _previousMask.release();
    _lastProcessedFrame = nil;
    poolToRelease = _outputPool;
    _outputPool = NULL;
    _poolWidth = 0;
    _poolHeight = 0;
  }
  if (poolToRelease) {
    CVPixelBufferPoolRelease(poolToRelease);
  }
  NSLog(@"[ExecutorchFrameProcessor] Model unloaded");
}

#pragma mark - VideoFrameProcessorDelegate

- (RTCVideoFrame *)capturer:(RTCVideoCapturer *)capturer
       didCaptureVideoFrame:(RTCVideoFrame *)frame {
  std::lock_guard<std::mutex> lock(_mutex);
  if (!_segmentation) {
    _lastProcessedFrame = nil;
    return frame;
  }

  RTCVideoFrame *result = nil;
  try {
    result = [self processFrameLocked:frame];
  } catch (const std::exception &e) {
    NSLog(@"[ExecutorchFrameProcessor] processFrame failed: %s", e.what());
  } catch (...) {
    NSLog(@"[ExecutorchFrameProcessor] processFrame failed (unknown)");
  }

  if (result) {
    _lastProcessedFrame = result;
    return result;
  }
  return _lastProcessedFrame ?: frame;
}

#pragma mark - Core Pipeline (helpers below assume _mutex is held)

- (RTCVideoFrame *)processFrameLocked:(RTCVideoFrame *)frame {
  NSTimeInterval startTime = [[NSDate date] timeIntervalSince1970];

  CVPixelBufferRef inputPixelBuffer = NULL;
  bool ownsInput = false;
  if ([frame.buffer isKindOfClass:[RTCCVPixelBuffer class]]) {
    inputPixelBuffer = ((RTCCVPixelBuffer *)frame.buffer).pixelBuffer;
  } else {
    inputPixelBuffer = [self createPixelBufferFromI420:frame.buffer];
    if (!inputPixelBuffer) {
      return nil;
    }
    ownsInput = true;
  }

  CIImage *maskImage = [self generateMaskLockedForPixelBuffer:inputPixelBuffer
                                                     rotation:frame.rotation];
  if (!maskImage) {
    if (ownsInput) {
      CVPixelBufferRelease(inputPixelBuffer);
    }
    return nil;
  }

  size_t width = CVPixelBufferGetWidth(inputPixelBuffer);
  size_t height = CVPixelBufferGetHeight(inputPixelBuffer);
  [self ensurePoolLockedForWidth:width height:height];
  if (!_outputPool) {
    if (ownsInput) {
      CVPixelBufferRelease(inputPixelBuffer);
    }
    return nil;
  }

  CVPixelBufferRef outputBuffer = NULL;
  CVReturn poolStatus = CVPixelBufferPoolCreatePixelBuffer(
      kCFAllocatorDefault, _outputPool, &outputBuffer);
  if (poolStatus != kCVReturnSuccess) {
    if (ownsInput) {
      CVPixelBufferRelease(inputPixelBuffer);
    }
    return nil;
  }

  CIImage *original = [CIImage imageWithCVPixelBuffer:inputPixelBuffer];
  CGFloat scaleX = (CGFloat)width / maskImage.extent.size.width;
  CGFloat scaleY = (CGFloat)height / maskImage.extent.size.height;
  CIImage *scaledMask = [maskImage
      imageByApplyingTransform:CGAffineTransformMakeScale(scaleX, scaleY)];

  CIFilter *blurFilter = [CIFilter filterWithName:@"CIGaussianBlur"];
  [blurFilter setValue:[original imageByClampingToExtent]
                forKey:kCIInputImageKey];
  [blurFilter setValue:@(_blurRadius) forKey:kCIInputRadiusKey];
  CIImage *blurred =
      [blurFilter.outputImage imageByCroppingToRect:original.extent];

  CIFilter *blendFilter = [CIFilter filterWithName:@"CIBlendWithMask"];
  [blendFilter setValue:original forKey:kCIInputImageKey];
  [blendFilter setValue:blurred forKey:kCIInputBackgroundImageKey];
  [blendFilter setValue:scaledMask forKey:kCIInputMaskImageKey];
  CIImage *composited = blendFilter.outputImage;

  CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
  [_ciContext render:composited
      toCVPixelBuffer:outputBuffer
               bounds:original.extent
           colorSpace:colorSpace];
  CGColorSpaceRelease(colorSpace);

  RTCCVPixelBuffer *rtcBuffer =
      [[RTCCVPixelBuffer alloc] initWithPixelBuffer:outputBuffer];
  RTCVideoFrame *outputFrame =
      [[RTCVideoFrame alloc] initWithBuffer:rtcBuffer
                                   rotation:frame.rotation
                                timeStampNs:frame.timeStampNs];

  CVPixelBufferRelease(outputBuffer);
  if (ownsInput) {
    CVPixelBufferRelease(inputPixelBuffer);
  }

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

- (CIImage *)generateMaskLockedForPixelBuffer:(CVPixelBufferRef)pixelBuffer
                                     rotation:(RTCVideoRotation)rotation {
  size_t width = CVPixelBufferGetWidth(pixelBuffer);
  size_t height = CVPixelBufferGetHeight(pixelBuffer);

  CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);

  cv::Mat rgbMat;
  OSType format = CVPixelBufferGetPixelFormatType(pixelBuffer);
  if (format == kCVPixelFormatType_32BGRA) {
    void *baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer);
    size_t bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);
    cv::Mat bgraMat((int)height, (int)width, CV_8UC4, baseAddress, bytesPerRow);
    cv::cvtColor(bgraMat, rgbMat, cv::COLOR_BGRA2RGB);
  } else if (format == kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange ||
             format == kCVPixelFormatType_420YpCbCr8BiPlanarFullRange) {
    cv::Mat yMat((int)height, (int)width, CV_8UC1,
                 CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 0),
                 CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 0));
    cv::Mat uvMat((int)height / 2, (int)width / 2, CV_8UC2,
                  CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 1),
                  CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 1));
    cv::Mat yuvMat((int)height * 3 / 2, (int)width, CV_8UC1);
    yMat.copyTo(yuvMat(cv::Rect(0, 0, (int)width, (int)height)));
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

  cv::Mat mask;
  try {
    JSTensorViewIn pixelData;
    pixelData.dataPtr = rgbRotated.data;
    pixelData.sizes = {rgbRotated.rows, rgbRotated.cols, 3};
    pixelData.scalarType = executorch::aten::ScalarType::Byte;

    std::set<std::string, std::less<>> classesOfInterest = {"foreground"};
    auto result =
        _segmentation->generateFromPixels(pixelData, classesOfInterest, false);

    if (result.classBuffers && result.classBuffers->count("foreground")) {
      auto &fgBuffer = result.classBuffers->at("foreground");
      auto *fgData = reinterpret_cast<float *>(fgBuffer->data());
      mask = cv::Mat(_modelHeight, _modelWidth, CV_32FC1, fgData).clone();
    } else {
      return nil;
    }
  } catch (const std::exception &e) {
    NSLog(@"[ExecutorchFrameProcessor] Segmentation failed: %s", e.what());
    return nil;
  }

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

  if (_previousMask.empty() || _previousMask.size() != maskRotated.size()) {
    _previousMask = maskRotated.clone();
  } else {
    cv::addWeighted(maskRotated, EMA_ALPHA, _previousMask, 1.0f - EMA_ALPHA, 0,
                    maskRotated);
    _previousMask = maskRotated.clone();
  }

  cv::Mat kernel = cv::getStructuringElement(cv::MORPH_RECT, cv::Size(3, 3));
  cv::erode(maskRotated, maskRotated, kernel, cv::Point(-1, -1), 1);
  cv::dilate(maskRotated, maskRotated, kernel, cv::Point(-1, -1), 1);

  // Match Android's mask softness — Android applies two GPU mask-blur passes
  // at sigma 5 (effective sigma ~ 5*sqrt(2)). One OpenCV pass at sigma 7 gets
  // close enough on iOS without an extra round trip.
  cv::GaussianBlur(maskRotated, maskRotated, cv::Size(0, 0), 7.0);

  cv::Mat mask8u;
  maskRotated.convertTo(mask8u, CV_8UC1, 255.0);

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

  cv::Mat i420Mat(height * 3 / 2, width, CV_8UC1);
  for (int row = 0; row < height; row++) {
    memcpy(i420Mat.ptr(row), dataY + row * strideY, width);
  }
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

- (void)ensurePoolLockedForWidth:(size_t)width height:(size_t)height {
  if (_outputPool && _poolWidth == width && _poolHeight == height) {
    return;
  }
  if (_outputPool) {
    CVPixelBufferPoolRelease(_outputPool);
    _outputPool = NULL;
  }
  NSDictionary *attrs = @{
    (id)kCVPixelBufferPixelFormatTypeKey : @(kCVPixelFormatType_32BGRA),
    (id)kCVPixelBufferWidthKey : @(width),
    (id)kCVPixelBufferHeightKey : @(height),
    (id)kCVPixelBufferIOSurfacePropertiesKey : @{},
    (id)kCVPixelBufferMetalCompatibilityKey : @YES,
  };
  CVPixelBufferPoolCreate(kCFAllocatorDefault, NULL,
                          (__bridge CFDictionaryRef)attrs, &_outputPool);
  _poolWidth = width;
  _poolHeight = height;
}

@end
