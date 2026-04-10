#import "ExecutorchFrameProcessor.h"
#import <WebRTC/RTCCVPixelBuffer.h>
#import <WebRTC/RTCI420Buffer.h>
#import <WebRTC/RTCMutableI420Buffer.h>
#import <WebRTC/RTCNativeI420Buffer.h>
#import <WebRTC/RTCNativeMutableI420Buffer.h>

#import <opencv2/opencv.hpp>
#import <rnexecutorch/host_objects/JSTensorViewIn.h>
#import <rnexecutorch/models/semantic_segmentation/BaseSemanticSegmentation.h>

using namespace rnexecutorch;
using namespace rnexecutorch::models::semantic_segmentation;

@implementation ExecutorchFrameProcessor {
  std::unique_ptr<BaseSemanticSegmentation> _segmentation;
  BOOL _modelLoaded;
  int _modelWidth;
  int _modelHeight;
  int _frameCount;
  NSTimeInterval _lastLogTime;
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
    _modelLoaded = NO;
    _modelWidth = 256;
    _modelHeight = 256;
    _frameCount = 0;
    _lastLogTime = 0;
  }
  return self;
}

- (void)configureWithModelPath:(NSString *)modelPath {
  NSLog(@"[ExecutorchFrameProcessor] Loading model from: %@", modelPath);

  try {
    std::vector<float> normMean = {};
    std::vector<float> normStd = {};
    std::vector<std::string> allClasses = {"foreground", "background"};

    _segmentation = std::make_unique<BaseSemanticSegmentation>(
        std::string([modelPath UTF8String]), normMean, normStd, allClasses,
        nullptr);

    auto inputShapes = _segmentation->getAllInputShapes();
    if (!inputShapes.empty() && inputShapes[0].size() >= 4) {
      _modelHeight = inputShapes[0][inputShapes[0].size() - 2];
      _modelWidth = inputShapes[0][inputShapes[0].size() - 1];
    }

    _modelLoaded = YES;
    NSLog(@"[ExecutorchFrameProcessor] Model loaded! Size: %dx%d", _modelWidth,
          _modelHeight);
  } catch (const std::exception &e) {
    NSLog(@"[ExecutorchFrameProcessor] Failed to load model: %s", e.what());
    _modelLoaded = NO;
  }
}

- (void)unloadModel {
  _segmentation.reset();
  _modelLoaded = NO;
}

- (RTCVideoFrame *)capturer:(RTCVideoCapturer *)capturer
       didCaptureVideoFrame:(RTCVideoFrame *)frame {
  _frameCount++;

  // TEST: Just return the original frame to check if colors are correct without
  // processing return frame;

  // Get I420 buffer
  id<RTCI420Buffer> i420Buffer = [frame.buffer toI420];
  if (!i420Buffer) {
    return frame;
  }

  int width = i420Buffer.width;
  int height = i420Buffer.height;
  int rotation = frame.rotation;
  int uvHeight = height / 2;
  int uvWidth = width / 2;

  // Rate-limited logging
  NSTimeInterval now = [[NSDate date] timeIntervalSince1970];
  if (now - _lastLogTime > 1.0) {
    NSLog(@"[ExecutorchFrameProcessor] Frame: %dx%d, rotation=%d, fps=%.1f, "
          @"model=%d",
          width, height, rotation, _frameCount / (now - _lastLogTime),
          _modelLoaded);
    _lastLogTime = now;
    _frameCount = 0;
  }

  // Create mutable buffer for output
  id<RTCMutableI420Buffer> outBuffer =
      [[RTCMutableI420Buffer alloc] initWithWidth:width height:height];

  // Copy Y plane row by row (respecting stride)
  for (int row = 0; row < height; row++) {
    memcpy(outBuffer.mutableDataY + row * outBuffer.strideY,
           i420Buffer.dataY + row * i420Buffer.strideY, width);
  }

  // Copy U plane row by row
  for (int row = 0; row < uvHeight; row++) {
    memcpy(outBuffer.mutableDataU + row * outBuffer.strideU,
           i420Buffer.dataU + row * i420Buffer.strideU, uvWidth);
  }

  // Copy V plane row by row
  for (int row = 0; row < uvHeight; row++) {
    memcpy(outBuffer.mutableDataV + row * outBuffer.strideV,
           i420Buffer.dataV + row * i420Buffer.strideV, uvWidth);
  }

  // If no model loaded, just return the copy (no blur)
  if (!_modelLoaded || !_segmentation) {
    RTCVideoFrame *passthrough =
        [[RTCVideoFrame alloc] initWithBuffer:outBuffer
                                     rotation:frame.rotation
                                  timeStampNs:frame.timeStampNs];
    return passthrough;
  }

  // Convert I420 to RGB for model inference
  cv::Mat i420Mat(height * 3 / 2, width, CV_8UC1);
  memcpy(i420Mat.data, i420Buffer.dataY, width * height);

  uint8_t *uvDst = i420Mat.data + (height * width);
  for (int row = 0; row < uvHeight; row++) {
    memcpy(uvDst + row * uvWidth, i420Buffer.dataU + row * i420Buffer.strideU,
           uvWidth);
  }
  for (int row = 0; row < uvHeight; row++) {
    memcpy(uvDst + uvHeight * uvWidth + row * uvWidth,
           i420Buffer.dataV + row * i420Buffer.strideV, uvWidth);
  }

  cv::Mat rgbFull;
  cv::cvtColor(i420Mat, rgbFull, cv::COLOR_YUV2RGB_I420);

  // Rotate for model inference
  cv::Mat rgbRotated;
  if (rotation == RTCVideoRotation_90) {
    cv::rotate(rgbFull, rgbRotated, cv::ROTATE_90_CLOCKWISE);
  } else if (rotation == RTCVideoRotation_180) {
    cv::rotate(rgbFull, rgbRotated, cv::ROTATE_180);
  } else if (rotation == RTCVideoRotation_270) {
    cv::rotate(rgbFull, rgbRotated, cv::ROTATE_90_COUNTERCLOCKWISE);
  } else {
    rgbRotated = rgbFull;
  }

  // Run segmentation
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
      mask = cv::Mat::ones(_modelHeight, _modelWidth, CV_32FC1);
    }
  } catch (const std::exception &e) {
    NSLog(@"[ExecutorchFrameProcessor] Segmentation failed: %s", e.what());
    // On error, return unprocessed copy
    RTCVideoFrame *passthrough =
        [[RTCVideoFrame alloc] initWithBuffer:outBuffer
                                     rotation:frame.rotation
                                  timeStampNs:frame.timeStampNs];
    return passthrough;
  }

  // Resize mask and rotate back to match frame orientation
  cv::Mat fullMask;
  if (rotation == RTCVideoRotation_90 || rotation == RTCVideoRotation_270) {
    cv::Mat rotatedMask;
    cv::resize(mask, rotatedMask, cv::Size(height, width), 0, 0,
               cv::INTER_LINEAR);
    int inverseCode = (rotation == RTCVideoRotation_90)
                          ? cv::ROTATE_90_COUNTERCLOCKWISE
                          : cv::ROTATE_90_CLOCKWISE;
    cv::rotate(rotatedMask, fullMask, inverseCode);
  } else if (rotation == RTCVideoRotation_180) {
    cv::resize(mask, fullMask, cv::Size(width, height), 0, 0, cv::INTER_LINEAR);
    cv::rotate(fullMask, fullMask, cv::ROTATE_180);
  } else {
    cv::resize(mask, fullMask, cv::Size(width, height), 0, 0, cv::INTER_LINEAR);
  }

  // Blur mask edges for smooth transition
  cv::GaussianBlur(fullMask, fullMask, cv::Size(15, 15), 0);

  // Create Y mat from original
  cv::Mat yMat(height, width, CV_8UC1);
  for (int row = 0; row < height; row++) {
    memcpy(yMat.ptr(row), i420Buffer.dataY + row * i420Buffer.strideY, width);
  }

  // Create U and V mats
  cv::Mat uMat(uvHeight, uvWidth, CV_8UC1);
  cv::Mat vMat(uvHeight, uvWidth, CV_8UC1);
  for (int row = 0; row < uvHeight; row++) {
    memcpy(uMat.ptr(row), i420Buffer.dataU + row * i420Buffer.strideU, uvWidth);
    memcpy(vMat.ptr(row), i420Buffer.dataV + row * i420Buffer.strideV, uvWidth);
  }

  // Blur Y plane (2x downscale for less blocky artifacts)
  cv::Mat ySmall, yBlurredSmall, yBlurred;
  int smallW = width / 2;
  int smallH = height / 2;
  cv::resize(yMat, ySmall, cv::Size(smallW, smallH), 0, 0, cv::INTER_AREA);
  cv::stackBlur(ySmall, yBlurredSmall, cv::Size(31, 31));
  cv::resize(yBlurredSmall, yBlurred, cv::Size(width, height), 0, 0,
             cv::INTER_LINEAR);

  // Blur U and V planes (they're already at half res, just blur directly)
  cv::Mat uBlurred, vBlurred;
  cv::stackBlur(uMat, uBlurred, cv::Size(15, 15));
  cv::stackBlur(vMat, vBlurred, cv::Size(15, 15));

  // Downscale mask for UV blending (UV is half resolution)
  cv::Mat uvMask;
  cv::resize(fullMask, uvMask, cv::Size(uvWidth, uvHeight), 0, 0,
             cv::INTER_LINEAR);

  // Blend Y plane: foreground stays sharp, background gets blurred
  uint8_t *outY = outBuffer.mutableDataY;
  int outYStride = outBuffer.strideY;

  for (int row = 0; row < height; row++) {
    const uint8_t *srcY = yMat.ptr<uint8_t>(row);
    const uint8_t *blurY = yBlurred.ptr<uint8_t>(row);
    const float *maskRow = fullMask.ptr<float>(row);
    uint8_t *dstY = outY + row * outYStride;

    for (int col = 0; col < width; col++) {
      float fg = maskRow[col];
      dstY[col] =
          static_cast<uint8_t>(blurY[col] * (1.0f - fg) + srcY[col] * fg);
    }
  }

  // Blend U plane
  uint8_t *outU = outBuffer.mutableDataU;
  int outUStride = outBuffer.strideU;
  for (int row = 0; row < uvHeight; row++) {
    const uint8_t *srcU = uMat.ptr<uint8_t>(row);
    const uint8_t *blurU = uBlurred.ptr<uint8_t>(row);
    const float *maskRow = uvMask.ptr<float>(row);
    uint8_t *dstU = outU + row * outUStride;

    for (int col = 0; col < uvWidth; col++) {
      float fg = maskRow[col];
      dstU[col] =
          static_cast<uint8_t>(blurU[col] * (1.0f - fg) + srcU[col] * fg);
    }
  }

  // Blend V plane
  uint8_t *outV = outBuffer.mutableDataV;
  int outVStride = outBuffer.strideV;
  for (int row = 0; row < uvHeight; row++) {
    const uint8_t *srcV = vMat.ptr<uint8_t>(row);
    const uint8_t *blurV = vBlurred.ptr<uint8_t>(row);
    const float *maskRow = uvMask.ptr<float>(row);
    uint8_t *dstV = outV + row * outVStride;

    for (int col = 0; col < uvWidth; col++) {
      float fg = maskRow[col];
      dstV[col] =
          static_cast<uint8_t>(blurV[col] * (1.0f - fg) + srcV[col] * fg);
    }
  }

  RTCVideoFrame *processedFrame =
      [[RTCVideoFrame alloc] initWithBuffer:outBuffer
                                   rotation:frame.rotation
                                timeStampNs:frame.timeStampNs];
  return processedFrame;
}

@end
