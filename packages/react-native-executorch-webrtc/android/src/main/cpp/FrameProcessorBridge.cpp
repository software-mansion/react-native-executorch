#include <android/log.h>
#include <chrono>
#include <cmath>
#include <jni.h>
#include <memory>
#include <opencv2/opencv.hpp>
#include <set>
#include <string>
#include <vector>

// Use BaseSemanticSegmentation from react-native-executorch
#include <rnexecutorch/host_objects/JSTensorViewIn.h>
#include <rnexecutorch/models/semantic_segmentation/BaseSemanticSegmentation.h>

#define LOG_TAG "ExecutorchWebRTC-JNI"
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

using namespace rnexecutorch;
using namespace rnexecutorch::models::semantic_segmentation;

// Global segmentation model instance (reuses react-native-executorch's
// implementation)
static std::unique_ptr<BaseSemanticSegmentation> g_segmentation = nullptr;
static bool g_modelLoaded = false;
static std::string g_modelPath;

// Model input dimensions (dynamically read from model)
static int g_modelHeight = 256;
static int g_modelWidth = 256;

// Pre-allocated buffers
static cv::Mat g_resizedRgb;

// Debug logging rate limiter
static long long g_lastDebugLogTime = 0;

extern "C" {

/**
 * Load the segmentation model using BaseSemanticSegmentation
 */
JNIEXPORT jboolean JNICALL
Java_com_executorch_webrtc_ExecutorchFrameProcessor_loadModel(
    JNIEnv *env, jobject thiz, jstring modelPath) {
  const char *pathChars = env->GetStringUTFChars(modelPath, nullptr);
  if (pathChars == nullptr) {
    LOGE("Failed to get model path string");
    return JNI_FALSE;
  }

  g_modelPath = std::string(pathChars);
  env->ReleaseStringUTFChars(modelPath, pathChars);

  LOGD("Loading segmentation model via BaseSemanticSegmentation: %s",
       g_modelPath.c_str());

  try {
    // Create BaseSemanticSegmentation with:
    // - modelSource: path to .pte file
    // - normMean: empty (uses default 0, which means /255.0 normalization)
    // - normStd: empty (uses default 1)
    // - allClasses: ["foreground", "background"] for binary segmentation
    // - callInvoker: nullptr (we don't need JSI operations)
    std::vector<float> normMean = {}; // Default normalization
    std::vector<float> normStd = {};
    std::vector<std::string> allClasses = {"foreground", "background"};

    g_segmentation = std::make_unique<BaseSemanticSegmentation>(
        g_modelPath, normMean, normStd, allClasses, nullptr);

    // Get model input size from shape [N, C, H, W]
    auto inputShapes = g_segmentation->getAllInputShapes();
    if (!inputShapes.empty() && inputShapes[0].size() >= 4) {
      g_modelHeight = inputShapes[0][inputShapes[0].size() - 2];
      g_modelWidth = inputShapes[0][inputShapes[0].size() - 1];
    }

    LOGD("Model input size: %dx%d", g_modelWidth, g_modelHeight);

    // Pre-allocate buffers
    g_resizedRgb = cv::Mat(g_modelHeight, g_modelWidth, CV_8UC3);

    g_modelLoaded = true;
    LOGD("✅ Segmentation model loaded successfully via "
         "BaseSemanticSegmentation!");
    return JNI_TRUE;
  } catch (const std::exception &e) {
    LOGE("❌ Failed to load model: %s", e.what());
    g_modelLoaded = false;
    g_segmentation.reset();
    return JNI_FALSE;
  }
}

/**
 * Process I420 frame - does segmentation and applies blur in one call.
 *
 * @param yData Y plane data
 * @param uData U plane data
 * @param vData V plane data
 * @param width Frame width
 * @param height Frame height
 * @param yStride Y plane stride
 * @param uvStride U/V plane stride
 * @param rotation Frame rotation in degrees (0, 90, 180, 270)
 * @return Array of 3 byte arrays [Y, U, V] with background blurred (or null on
 * error)
 */
JNIEXPORT jobjectArray JNICALL
Java_com_executorch_webrtc_ExecutorchFrameProcessor_processI420Frame(
    JNIEnv *env, jobject thiz, jbyteArray yData, jbyteArray uData,
    jbyteArray vData, jint width, jint height, jint yStride, jint uvStride,
    jint rotation) {

  // Get input buffers and their actual sizes
  jsize yDataSize = env->GetArrayLength(yData);
  jsize uDataSize = env->GetArrayLength(uData);
  jsize vDataSize = env->GetArrayLength(vData);

  jbyte *yPtr = env->GetByteArrayElements(yData, nullptr);
  jbyte *uPtr = env->GetByteArrayElements(uData, nullptr);
  jbyte *vPtr = env->GetByteArrayElements(vData, nullptr);

  if (!yPtr || !uPtr || !vPtr) {
    LOGE("Failed to get buffer pointers");
    // I'm not sure why we're releasing this here, I mean this is still used in
    // the C++ for regular frames, no? Or we are copying?
    if (yPtr)
      env->ReleaseByteArrayElements(yData, yPtr, JNI_ABORT);
    if (uPtr)
      env->ReleaseByteArrayElements(uData, uPtr, JNI_ABORT);
    if (vPtr)
      env->ReleaseByteArrayElements(vData, vPtr, JNI_ABORT);
    return nullptr;
  }

  // Determine actual stride based on buffer sizes
  // what the fuck is stride?
  int actualYStride = (yDataSize >= yStride * height) ? yStride : width;
  int actualUVStride =
      (uDataSize >= uvStride * (height / 2)) ? uvStride : (width / 2);

  // Rate-limited logging of buffer info
  static long long lastBufferLogTime = 0;
  auto now = std::chrono::duration_cast<std::chrono::milliseconds>(
                 std::chrono::system_clock::now().time_since_epoch())
                 .count();
  if (now - lastBufferLogTime > 2000) {
    LOGD("Buffer sizes: Y=%d, U=%d, V=%d, actualYStride=%d, actualUVStride=%d",
         yDataSize, uDataSize, vDataSize, actualYStride, actualUVStride);
    lastBufferLogTime = now;
  }

  // Create output buffers for Y, U, V
  jbyteArray outYData = env->NewByteArray(actualYStride * height);
  jbyteArray outUData = env->NewByteArray(actualUVStride * (height / 2));
  jbyteArray outVData = env->NewByteArray(actualUVStride * (height / 2));
  if (!outYData || !outUData || !outVData) {
    env->ReleaseByteArrayElements(yData, yPtr, JNI_ABORT);
    env->ReleaseByteArrayElements(uData, uPtr, JNI_ABORT);
    env->ReleaseByteArrayElements(vData, vPtr, JNI_ABORT);
    return nullptr;
  }

  // Merge I420 to single buffer for cvtColor
  cv::Mat i420(height * 3 / 2, width, CV_8UC1);

  // Copy Y plane row by row (handle stride correctly)
  uint8_t *ySrc = reinterpret_cast<uint8_t *>(yPtr);
  for (int row = 0; row < height; row++) {
    memcpy(i420.ptr(row), ySrc + row * actualYStride, width);
  }

  // Copy U and V planes
  auto *uSrc = reinterpret_cast<uint8_t *>(uPtr);
  auto *vSrc = reinterpret_cast<uint8_t *>(vPtr);
  uint8_t *uvDst = i420.ptr(height);
  int uvWidth = width / 2;
  int uvHeight = height / 2;

  for (int row = 0; row < uvHeight; row++) {
    memcpy(uvDst + row * uvWidth, uSrc + row * actualUVStride, uvWidth);
  }
  for (int row = 0; row < uvHeight; row++) {
    memcpy(uvDst + uvHeight * uvWidth + row * uvWidth,
           vSrc + row * actualUVStride, uvWidth);
  }

  // Convert to RGB
  cv::Mat rgbFull;
  cv::cvtColor(i420, rgbFull, cv::COLOR_YUV2RGB_I420);
  // Im not sure why we need all the copying, cant we just do sumn like this?
  // cv::cvtColor(i420, rgbFull, cv::COLOR_YUV2RGB);

  // Rotate image to upright for model inference
  cv::Mat rgbRotated;
  int rotateCode = -1;
  if (rotation == 90) {
    rotateCode = cv::ROTATE_90_CLOCKWISE;
  } else if (rotation == 180) {
    rotateCode = cv::ROTATE_180;
  } else if (rotation == 270) {
    rotateCode = cv::ROTATE_90_COUNTERCLOCKWISE;
  }

  if (rotateCode >= 0) {
    cv::rotate(rgbFull, rgbRotated, rotateCode);
  } else {
    rgbRotated = rgbFull;
  }

  // Run segmentation
  cv::Mat mask;

  if (!g_modelLoaded || !g_segmentation) {
    // Rate-limited logging for missing model
    if (now - g_lastDebugLogTime > 1000) {
      LOGD("Model not loaded, using placeholder ellipse mask");
      g_lastDebugLogTime = now;
    }

    // Placeholder ellipse mask
    mask = cv::Mat(g_modelHeight, g_modelWidth, CV_32FC1);
    const float centerY = g_modelHeight / 2.0f;
    const float centerX = g_modelWidth / 2.0f;
    const float radiusY = g_modelHeight * 0.4f;
    const float radiusX = g_modelWidth * 0.35f;

    for (int y = 0; y < g_modelHeight; y++) {
      float *row = mask.ptr<float>(y);
      for (int x = 0; x < g_modelWidth; x++) {
        float dy = (y - centerY) / radiusY;
        float dx = (x - centerX) / radiusX;
        float dist = dx * dx + dy * dy;
        row[x] = (dist < 1.0f)
                     ? 1.0f
                     : ((dist < 1.3f) ? (1.0f - ((dist - 1.0f) / 0.3f)) : 0.0f);
      }
    }
  } else {
    // Use BaseSemanticSegmentation via generateFromPixels
    try {
      // Create JSTensorViewIn from the rotated RGB image
      // generateFromPixels expects [height, width, 3] RGB uint8 data
      JSTensorViewIn pixelData;
      pixelData.dataPtr = rgbRotated.data;
      pixelData.sizes = {rgbRotated.rows, rgbRotated.cols, 3};
      pixelData.scalarType = executorch::aten::ScalarType::Byte;

      // Run inference - returns foreground probability mask
      std::set<std::string, std::less<>> classesOfInterest = {"foreground"};
      auto result = g_segmentation->generateFromPixels(
          pixelData, classesOfInterest, false);

      // Extract foreground mask from result
      if (result.classBuffers && result.classBuffers->count("foreground")) {
        auto &fgBuffer = result.classBuffers->at("foreground");
        auto *fgData = reinterpret_cast<float *>(fgBuffer->data());

        // The mask is at model input size, need to get its dimensions
        // For now, assume it's the model input size
        mask = cv::Mat(g_modelHeight, g_modelWidth, CV_32FC1, fgData).clone();

        // Rate-limited debug logging
        if (now - g_lastDebugLogTime > 1000) {
          double minVal, maxVal;
          cv::minMaxLoc(mask, &minVal, &maxVal);
          LOGD("Segmentation result: size=%dx%d, min=%.4f, max=%.4f", mask.cols,
               mask.rows, minVal, maxVal);
          g_lastDebugLogTime = now;
        }
      } else {
        LOGE("No foreground mask in result, using fallback");
        mask = cv::Mat::ones(g_modelHeight, g_modelWidth, CV_32FC1);
      }
    } catch (const std::exception &e) {
      LOGE("Segmentation failed: %s", e.what());
      mask = cv::Mat::ones(g_modelHeight, g_modelWidth, CV_32FC1);
    }
  }

  // Resize mask to rotated frame size, then rotate back to original orientation
  cv::Mat fullMask;
  if (rotation == 90 || rotation == 270) {
    cv::Mat rotatedMask;
    cv::resize(mask, rotatedMask, cv::Size(height, width), 0, 0,
               cv::INTER_LINEAR);
    int inverseRotateCode = (rotation == 90) ? cv::ROTATE_90_COUNTERCLOCKWISE
                                             : cv::ROTATE_90_CLOCKWISE;
    cv::rotate(rotatedMask, fullMask, inverseRotateCode);
  } else if (rotation == 180) {
    cv::resize(mask, fullMask, cv::Size(width, height), 0, 0, cv::INTER_LINEAR);
    cv::rotate(fullMask, fullMask, cv::ROTATE_180);
  } else {
    cv::resize(mask, fullMask, cv::Size(width, height), 0, 0, cv::INTER_LINEAR);
  }

  // Apply smoothstep to mask
  const float lowThresh = 0.3f;
  const float highThresh = 0.7f;
  cv::Mat t;
  cv::subtract(fullMask, lowThresh, t);
  cv::multiply(t, 1.0f / (highThresh - lowThresh), t);
  cv::min(t, 1.0f, t);
  cv::max(t, 0.0f, t);
  cv::Mat t2, smoothMask;
  cv::multiply(t, t, t2);
  cv::multiply(t, -2.0f, smoothMask);
  cv::add(smoothMask, 3.0f, smoothMask);
  cv::multiply(t2, smoothMask, fullMask);

  // Blur the mask edges for smoother blending
  cv::GaussianBlur(fullMask, fullMask, cv::Size(15, 15), 0);

  // Create Y plane Mat (packed, no stride padding)
  cv::Mat yMat(height, width, CV_8UC1);
  for (int row = 0; row < height; row++) {
    memcpy(yMat.ptr(row), ySrc + row * actualYStride, width);
  }

  // Create blurred Y using downscale-blur-upscale for performance
  // 4x downscale for speed, stackBlur is O(1)
  cv::Mat ySmall, yBlurredSmall, yBlurred;
  int smallW = width / 4;
  int smallH = height / 4;
  cv::resize(yMat, ySmall, cv::Size(smallW, smallH), 0, 0, cv::INTER_AREA);
  cv::stackBlur(ySmall, yBlurredSmall, cv::Size(21, 21));
  cv::resize(yBlurredSmall, yBlurred, cv::Size(width, height), 0, 0,
             cv::INTER_LINEAR);

  // Create U and V mats from input (packed, no stride padding)
  cv::Mat uMat(uvHeight, uvWidth, CV_8UC1);
  cv::Mat vMat(uvHeight, uvWidth, CV_8UC1);
  for (int row = 0; row < uvHeight; row++) {
    memcpy(uMat.ptr(row), uSrc + row * actualUVStride, uvWidth);
    memcpy(vMat.ptr(row), vSrc + row * actualUVStride, uvWidth);
  }

  // Blur U and V using same downscale-blur-upscale approach for performance
  // U/V are already at half res, so 2x downscale = quarter res
  cv::Mat uSmall, vSmall, uBlurredSmall, vBlurredSmall, uBlurred, vBlurred;
  int uvSmallW = uvWidth / 2;
  int uvSmallH = uvHeight / 2;
  cv::resize(uMat, uSmall, cv::Size(uvSmallW, uvSmallH), 0, 0, cv::INTER_AREA);
  cv::resize(vMat, vSmall, cv::Size(uvSmallW, uvSmallH), 0, 0, cv::INTER_AREA);
  cv::stackBlur(uSmall, uBlurredSmall, cv::Size(11, 11));
  cv::stackBlur(vSmall, vBlurredSmall, cv::Size(11, 11));
  cv::resize(uBlurredSmall, uBlurred, cv::Size(uvWidth, uvHeight), 0, 0,
             cv::INTER_LINEAR);
  cv::resize(vBlurredSmall, vBlurred, cv::Size(uvWidth, uvHeight), 0, 0,
             cv::INTER_LINEAR);

  // Downscale mask for UV blending (UV is half resolution)
  cv::Mat uvMask;
  cv::resize(fullMask, uvMask, cv::Size(uvWidth, uvHeight), 0, 0,
             cv::INTER_LINEAR);

  // Blend Y: foreground (mask=1) uses original, background (mask=0) uses
  // blurred
  std::vector<uint8_t> outY(actualYStride * height);

  for (int row = 0; row < height; row++) {
    const uint8_t *srcY = yMat.ptr<uint8_t>(row);
    const uint8_t *blurY = yBlurred.ptr<uint8_t>(row);
    const float *maskRow = fullMask.ptr<float>(row);
    uint8_t *dstY = outY.data() + row * actualYStride;

    for (int col = 0; col < width; col++) {
      float prob = maskRow[col];
      dstY[col] =
          static_cast<uint8_t>(blurY[col] * (1.0f - prob) + srcY[col] * prob);
    }
    if (actualYStride > width) {
      memcpy(dstY + width, ySrc + row * actualYStride + width,
             actualYStride - width);
    }
  }

  // Blend U plane
  std::vector<uint8_t> outU(actualUVStride * uvHeight);
  for (int row = 0; row < uvHeight; row++) {
    const uint8_t *srcU = uMat.ptr<uint8_t>(row);
    const uint8_t *blurU = uBlurred.ptr<uint8_t>(row);
    const float *maskRow = uvMask.ptr<float>(row);
    uint8_t *dstU = outU.data() + row * actualUVStride;

    for (int col = 0; col < uvWidth; col++) {
      float prob = maskRow[col];
      dstU[col] =
          static_cast<uint8_t>(blurU[col] * (1.0f - prob) + srcU[col] * prob);
    }
    if (actualUVStride > uvWidth) {
      memcpy(dstU + uvWidth, uSrc + row * actualUVStride + uvWidth,
             actualUVStride - uvWidth);
    }
  }

  // Blend V plane
  std::vector<uint8_t> outV(actualUVStride * uvHeight);
  for (int row = 0; row < uvHeight; row++) {
    const uint8_t *srcV = vMat.ptr<uint8_t>(row);
    const uint8_t *blurV = vBlurred.ptr<uint8_t>(row);
    const float *maskRow = uvMask.ptr<float>(row);
    uint8_t *dstV = outV.data() + row * actualUVStride;

    for (int col = 0; col < uvWidth; col++) {
      float prob = maskRow[col];
      dstV[col] =
          static_cast<uint8_t>(blurV[col] * (1.0f - prob) + srcV[col] * prob);
    }
    if (actualUVStride > uvWidth) {
      memcpy(dstV + uvWidth, vSrc + row * actualUVStride + uvWidth,
             actualUVStride - uvWidth);
    }
  }

  // Copy data to output arrays
  env->SetByteArrayRegion(outYData, 0, actualYStride * height,
                          reinterpret_cast<jbyte *>(outY.data()));
  env->SetByteArrayRegion(outUData, 0, actualUVStride * uvHeight,
                          reinterpret_cast<jbyte *>(outU.data()));
  env->SetByteArrayRegion(outVData, 0, actualUVStride * uvHeight,
                          reinterpret_cast<jbyte *>(outV.data()));

  env->ReleaseByteArrayElements(yData, yPtr, JNI_ABORT);
  env->ReleaseByteArrayElements(uData, uPtr, JNI_ABORT);
  env->ReleaseByteArrayElements(vData, vPtr, JNI_ABORT);

  // Create result array of 3 byte arrays [Y, U, V]
  jclass byteArrayClass = env->FindClass("[B");
  jobjectArray result = env->NewObjectArray(3, byteArrayClass, nullptr);
  env->SetObjectArrayElement(result, 0, outYData);
  env->SetObjectArrayElement(result, 1, outUData);
  env->SetObjectArrayElement(result, 2, outVData);

  return result;
}

/**
 * Run segmentation on RGBA pixels, returns grayscale mask (0-255 bytes).
 * Used by GL-based blur pipeline.
 */
JNIEXPORT jbyteArray JNICALL
Java_com_executorch_webrtc_ExecutorchFrameProcessor_runSegmentation(
    JNIEnv *env, jobject thiz, jbyteArray rgbaData, jint width, jint height,
    jint rotation) {

  if (!g_modelLoaded || !g_segmentation) {
    LOGE("Model not loaded, cannot run segmentation");
    return nullptr;
  }

  jbyte *rgbaPtr = env->GetByteArrayElements(rgbaData, nullptr);
  if (!rgbaPtr) {
    LOGE("Failed to get RGBA data pointer");
    return nullptr;
  }

  try {
    // Convert RGBA to RGB (OpenCV expects BGR, but we'll convert to RGB for
    // model)
    cv::Mat rgba(height, width, CV_8UC4, reinterpret_cast<uint8_t *>(rgbaPtr));
    cv::Mat rgb;
    cv::cvtColor(rgba, rgb, cv::COLOR_RGBA2RGB);

    // Apply rotation for model inference
    cv::Mat rgbRotated;
    if (rotation == 90) {
      cv::rotate(rgb, rgbRotated, cv::ROTATE_90_CLOCKWISE);
    } else if (rotation == 180) {
      cv::rotate(rgb, rgbRotated, cv::ROTATE_180);
    } else if (rotation == 270) {
      cv::rotate(rgb, rgbRotated, cv::ROTATE_90_COUNTERCLOCKWISE);
    } else {
      rgbRotated = rgb;
    }

    // Run segmentation model
    JSTensorViewIn pixelData;
    pixelData.dataPtr = rgbRotated.data;
    pixelData.sizes = {rgbRotated.rows, rgbRotated.cols, 3};
    pixelData.scalarType = executorch::aten::ScalarType::Byte;

    std::set<std::string, std::less<>> classesOfInterest = {"foreground"};
    auto result =
        g_segmentation->generateFromPixels(pixelData, classesOfInterest, false);

    // Extract mask
    cv::Mat mask;
    if (result.classBuffers && result.classBuffers->count("foreground")) {
      auto &fgBuffer = result.classBuffers->at("foreground");
      auto *fgData = reinterpret_cast<float *>(fgBuffer->data());
      mask = cv::Mat(g_modelHeight, g_modelWidth, CV_32FC1, fgData).clone();
    } else {
      LOGE("No foreground mask in result");
      env->ReleaseByteArrayElements(rgbaData, rgbaPtr, JNI_ABORT);
      return nullptr;
    }

    // Rotate mask back to original orientation
    cv::Mat maskRotated;
    if (rotation == 90) {
      cv::rotate(mask, maskRotated, cv::ROTATE_90_COUNTERCLOCKWISE);
    } else if (rotation == 180) {
      cv::rotate(mask, maskRotated, cv::ROTATE_180);
    } else if (rotation == 270) {
      cv::rotate(mask, maskRotated, cv::ROTATE_90_CLOCKWISE);
    } else {
      maskRotated = mask;
    }

    // Resize mask to input dimensions
    cv::Mat maskResized;
    cv::resize(maskRotated, maskResized, cv::Size(width, height), 0, 0,
               cv::INTER_LINEAR);

    // Convert float mask (0-1) to bytes (0-255)
    cv::Mat maskBytes;
    maskResized.convertTo(maskBytes, CV_8UC1, 255.0);

    // Create output array
    const int maskSize = width * height;
    jbyteArray output = env->NewByteArray(maskSize);
    if (!output) {
      env->ReleaseByteArrayElements(rgbaData, rgbaPtr, JNI_ABORT);
      return nullptr;
    }

    env->SetByteArrayRegion(output, 0, maskSize,
                            reinterpret_cast<jbyte *>(maskBytes.data));

    env->ReleaseByteArrayElements(rgbaData, rgbaPtr, JNI_ABORT);
    return output;

  } catch (const std::exception &e) {
    LOGE("Segmentation failed: %s", e.what());
    env->ReleaseByteArrayElements(rgbaData, rgbaPtr, JNI_ABORT);
    return nullptr;
  }
}
} // extern "C"
