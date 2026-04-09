#include <android/log.h>
#include <chrono>
#include <cmath>
#include <jni.h>
#include <memory>
#include <opencv2/opencv.hpp>
#include <string>
#include <vector>

#include <executorch/extension/module/module.h>
#include <executorch/extension/tensor/tensor.h>
#include <executorch/runtime/core/exec_aten/exec_aten.h>

#define LOG_TAG "ExecutorchWebRTC-JNI"
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

// Global model instance
static std::unique_ptr<executorch::extension::Module> g_model = nullptr;
static bool g_modelLoaded = false;
static std::string g_modelPath;

// Model input dimensions (dynamically read from model)
static int g_modelHeight = 256;
static int g_modelWidth = 256;
static bool g_buffersInitialized = false;

// Pre-allocated buffers (resized dynamically based on model input)
static std::vector<float> g_inputData;
static cv::Mat g_resizedRgb;
static cv::Mat g_floatMat;

// Debug logging rate limiter
static long long g_lastDebugLogTime = 0;

extern "C" {

/**
 * Reallocate buffers based on model input dimensions
 */
static void reallocateBuffers(int height, int width) {
  g_modelHeight = height;
  g_modelWidth = width;
  g_inputData.resize(1 * 3 * height * width);
  g_resizedRgb = cv::Mat(height, width, CV_8UC3);
  g_floatMat = cv::Mat(height, width, CV_32FC3);
  g_buffersInitialized = true;
  LOGD("Buffers reallocated for model size: %dx%d", width, height);
}

/**
 * Ensure buffers are initialized (called before first frame if needed)
 */
static void ensureBuffersInitialized() {
  if (!g_buffersInitialized) {
    reallocateBuffers(256, 256);
  }
}

/**
 * Load the segmentation model
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

  LOGD("Loading ExecuTorch model from: %s", g_modelPath.c_str());

  try {
    g_model = std::make_unique<executorch::extension::Module>(
        g_modelPath,
        executorch::extension::Module::LoadMode::MmapUseMlockIgnoreErrors);

    // Get model input shape to determine expected dimensions
    auto methodMeta = g_model->method_meta("forward");
    if (methodMeta.ok()) {
      auto inputMeta = methodMeta->input_tensor_meta(0);
      if (inputMeta.ok()) {
        auto sizes = inputMeta->sizes();
        // Expected shape: [1, 3, H, W] (NCHW format)
        if (sizes.size() >= 4) {
          int modelH = static_cast<int>(sizes[sizes.size() - 2]);
          int modelW = static_cast<int>(sizes[sizes.size() - 1]);
          LOGD("Model input shape detected: [1, 3, %d, %d]", modelH, modelW);
          reallocateBuffers(modelH, modelW);
        } else if (sizes.size() >= 2) {
          int modelH = static_cast<int>(sizes[sizes.size() - 2]);
          int modelW = static_cast<int>(sizes[sizes.size() - 1]);
          LOGD("Model input shape (2D): [%d, %d]", modelH, modelW);
          reallocateBuffers(modelH, modelW);
        } else {
          LOGD("Could not determine model input shape, using default 256x256");
          reallocateBuffers(256, 256);
        }
      } else {
        LOGD("Could not get input tensor meta, using default 256x256");
        reallocateBuffers(256, 256);
      }
    } else {
      LOGD("Could not get method meta, using default 256x256");
      reallocateBuffers(256, 256);
    }

    g_modelLoaded = true;
    LOGD("✅ Model loaded successfully!");
    return JNI_TRUE;
  } catch (const std::exception &e) {
    LOGE("❌ Failed to load model: %s", e.what());
    g_modelLoaded = false;
    reallocateBuffers(256, 256); // Use default size
    return JNI_FALSE;
  }
}

/**
 * Process I420 frame directly - does segmentation and applies mask in one call.
 * This avoids multiple JNI crossings and RGB conversions in Kotlin.
 *
 * @param yData Y plane data
 * @param uData U plane data
 * @param vData V plane data
 * @param width Frame width
 * @param height Frame height
 * @param yStride Y plane stride
 * @param uvStride U/V plane stride
 * @param rotation Frame rotation in degrees (0, 90, 180, 270)
 * @return Modified Y plane with background blacked out (or null on error)
 */
JNIEXPORT jbyteArray JNICALL
Java_com_executorch_webrtc_ExecutorchFrameProcessor_processI420Frame(
    JNIEnv *env, jobject thiz, jbyteArray yData, jbyteArray uData,
    jbyteArray vData, jint width, jint height, jint yStride, jint uvStride,
    jint rotation) {
  // Ensure buffers are initialized
  ensureBuffersInitialized();

  // Get input buffers and their actual sizes
  jsize yDataSize = env->GetArrayLength(yData);
  jsize uDataSize = env->GetArrayLength(uData);
  jsize vDataSize = env->GetArrayLength(vData);

  jbyte *yPtr = env->GetByteArrayElements(yData, nullptr);
  jbyte *uPtr = env->GetByteArrayElements(uData, nullptr);
  jbyte *vPtr = env->GetByteArrayElements(vData, nullptr);

  if (!yPtr || !uPtr || !vPtr) {
    LOGE("Failed to get buffer pointers");
    if (yPtr)
      env->ReleaseByteArrayElements(yData, yPtr, JNI_ABORT);
    if (uPtr)
      env->ReleaseByteArrayElements(uData, uPtr, JNI_ABORT);
    if (vPtr)
      env->ReleaseByteArrayElements(vData, vPtr, JNI_ABORT);
    return nullptr;
  }

  // Determine actual stride based on buffer sizes
  // If buffer is smaller than stride * height, the actual stride is width (no
  // padding)
  int actualYStride = (yDataSize >= yStride * height) ? yStride : width;
  int actualUVStride =
      (uDataSize >= uvStride * (height / 2)) ? uvStride : (width / 2);

  // Rate-limited logging of buffer info
  static long long lastBufferLogTime = 0;
  auto now = std::chrono::duration_cast<std::chrono::milliseconds>(
                 std::chrono::system_clock::now().time_since_epoch())
                 .count();
  if (now - lastBufferLogTime > 2000) {
    LOGD("Buffer sizes: Y=%d (expected %d), U=%d, V=%d, actualYStride=%d, "
         "actualUVStride=%d",
         yDataSize, yStride * height, uDataSize, vDataSize, actualYStride,
         actualUVStride);
    lastBufferLogTime = now;
  }

  // Create output Y buffer with actual stride
  jbyteArray outYData = env->NewByteArray(actualYStride * height);
  if (!outYData) {
    env->ReleaseByteArrayElements(yData, yPtr, JNI_ABORT);
    env->ReleaseByteArrayElements(uData, uPtr, JNI_ABORT);
    env->ReleaseByteArrayElements(vData, vPtr, JNI_ABORT);
    return nullptr;
  }

  // Merge I420 to single buffer for cvtColor
  // Create the combined I420 buffer (Y plane followed by U and V planes)
  cv::Mat i420(height * 3 / 2, width, CV_8UC1);

  // Copy Y plane row by row (handle stride correctly)
  uint8_t *ySrc = reinterpret_cast<uint8_t *>(yPtr);
  for (int row = 0; row < height; row++) {
    memcpy(i420.ptr(row), ySrc + row * actualYStride, width);
  }

  // Copy U and V planes
  uint8_t *uSrc = reinterpret_cast<uint8_t *>(uPtr);
  uint8_t *vSrc = reinterpret_cast<uint8_t *>(vPtr);
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

  // Rotate image to upright for model inference
  // Frame rotation tells us how the sensor is rotated, so we rotate opposite to
  // get upright
  cv::Mat rgbRotated;
  int rotateCode = -1; // -1 means no rotation needed
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

  // Resize to model input size (use dynamic dimensions)
  cv::resize(rgbRotated, g_resizedRgb, cv::Size(g_modelWidth, g_modelHeight));

  // Run segmentation
  cv::Mat mask;

  if (!g_modelLoaded || !g_model) {
    // Rate-limited logging for missing model
    auto now = std::chrono::duration_cast<std::chrono::milliseconds>(
                   std::chrono::system_clock::now().time_since_epoch())
                   .count();
    if (now - g_lastDebugLogTime > 1000) {
      LOGD("Model not loaded (g_modelLoaded=%d, g_model=%p), using placeholder "
           "ellipse mask",
           g_modelLoaded ? 1 : 0, g_model.get());
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
    // Run ExecuTorch model
    g_resizedRgb.convertTo(g_floatMat, CV_32FC3, 1.0 / 255.0);

    // Convert HWC to NCHW
    float *inputPtr = g_inputData.data();
    for (int c = 0; c < 3; c++) {
      for (int y = 0; y < g_modelHeight; y++) {
        const cv::Vec3f *row = g_floatMat.ptr<cv::Vec3f>(y);
        for (int x = 0; x < g_modelWidth; x++) {
          *inputPtr++ = row[x][c];
        }
      }
    }

    std::vector<executorch::aten::SizesType> shape = {1, 3, g_modelHeight,
                                                      g_modelWidth};
    auto inputTensor = executorch::extension::from_blob(
        g_inputData.data(), shape, executorch::aten::ScalarType::Float);

    std::vector<executorch::runtime::EValue> inputs = {inputTensor};
    auto result = g_model->forward(inputs);

    if (result.ok() && !result.get().empty()) {
      auto outputTensor = result.get()[0].toTensor();
      const float *outputData = outputTensor.const_data_ptr<float>();

      // Get output tensor dimensions
      int outputH = g_modelHeight;
      int outputW = g_modelWidth;
      if (outputTensor.dim() >= 2) {
        outputH = static_cast<int>(outputTensor.size(outputTensor.dim() - 2));
        outputW = static_cast<int>(outputTensor.size(outputTensor.dim() - 1));
      }

      // Rate-limited debug logging (once per second)
      auto now = std::chrono::duration_cast<std::chrono::milliseconds>(
                     std::chrono::system_clock::now().time_since_epoch())
                     .count();
      if (now - g_lastDebugLogTime > 1000) {
        // Log tensor info
        LOGD("Model output: dim=%zd, outputH=%d, outputW=%d, numel=%zd",
             (ssize_t)outputTensor.dim(), outputH, outputW,
             (ssize_t)outputTensor.numel());

        // Sample output values to understand the range
        ssize_t totalElements = outputTensor.numel();
        float minVal = outputData[0], maxVal = outputData[0], sum = 0;
        for (ssize_t i = 0; i < totalElements; i++) {
          float v = outputData[i];
          if (v < minVal)
            minVal = v;
          if (v > maxVal)
            maxVal = v;
          sum += v;
        }
        float mean = sum / totalElements;
        LOGD("Output stats: min=%.4f, max=%.4f, mean=%.4f", minVal, maxVal,
             mean);

        // Log first few values
        int numSamples = (totalElements < 10) ? (int)totalElements : 10;
        std::string samples = "First values: ";
        for (int i = 0; i < numSamples; i++) {
          samples += std::to_string(outputData[i]) + " ";
        }
        LOGD("%s", samples.c_str());

        g_lastDebugLogTime = now;
      }

      mask =
          cv::Mat(outputH, outputW, CV_32FC1, const_cast<float *>(outputData))
              .clone();
    } else {
      // Fallback - keep everything
      LOGE("Model forward FAILED! result.ok()=%d, result.get().empty()=%d",
           result.ok() ? 1 : 0,
           result.ok() ? (result.get().empty() ? 1 : 0) : -1);
      mask = cv::Mat::ones(g_modelHeight, g_modelWidth, CV_32FC1);
    }
  }

  // Resize mask to rotated frame size, then rotate back to original orientation
  cv::Mat fullMask;
  if (rotation == 90 || rotation == 270) {
    // For 90/270 rotation, the rotated image had swapped dimensions
    cv::Mat rotatedMask;
    cv::resize(mask, rotatedMask, cv::Size(height, width), 0, 0,
               cv::INTER_LINEAR); // Note: swapped w/h

    // Rotate mask back to original frame orientation (inverse of what we did to
    // the image)
    int inverseRotateCode = (rotation == 90) ? cv::ROTATE_90_COUNTERCLOCKWISE
                                             : cv::ROTATE_90_CLOCKWISE;
    cv::rotate(rotatedMask, fullMask, inverseRotateCode);
  } else if (rotation == 180) {
    cv::resize(mask, fullMask, cv::Size(width, height), 0, 0, cv::INTER_LINEAR);
    cv::rotate(fullMask, fullMask, cv::ROTATE_180);
  } else {
    // No rotation
    cv::resize(mask, fullMask, cv::Size(width, height), 0, 0, cv::INTER_LINEAR);
  }

  // Debug: log mask statistics after resize (rate-limited)
  {
    auto now = std::chrono::duration_cast<std::chrono::milliseconds>(
                   std::chrono::system_clock::now().time_since_epoch())
                   .count();
    static long long lastMaskLogTime = 0;
    if (now - lastMaskLogTime > 1000) {
      double minVal, maxVal;
      cv::minMaxLoc(fullMask, &minVal, &maxVal);
      cv::Scalar meanVal = cv::mean(fullMask);
      LOGD("Resized mask stats: size=%dx%d, min=%.4f, max=%.4f, mean=%.4f",
           fullMask.cols, fullMask.rows, minVal, maxVal, meanVal[0]);
      lastMaskLogTime = now;
    }
  }

  // Apply smoothstep to mask using OpenCV (vectorized/SIMD optimized)
  // smoothstep: values < 0.3 → 0, values > 0.7 → 1, smooth transition in
  // between
  const float lowThresh = 0.3f;
  const float highThresh = 0.7f;
  cv::Mat t;
  cv::subtract(fullMask, lowThresh, t);
  cv::multiply(t, 1.0f / (highThresh - lowThresh), t);
  cv::min(t, 1.0f, t);
  cv::max(t, 0.0f, t);
  // smoothstep: t*t*(3 - 2*t)
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
  // Downscale 3x, stack blur (O(1) fast blur), upscale back
  cv::Mat ySmall, yBlurredSmall, yBlurred;
  int smallW = width / 3;
  int smallH = height / 3;
  cv::resize(yMat, ySmall, cv::Size(smallW, smallH), 0, 0, cv::INTER_AREA);
  cv::stackBlur(ySmall, yBlurredSmall, cv::Size(25, 25)); // O(1) fast blur
  cv::resize(yBlurredSmall, yBlurred, cv::Size(width, height), 0, 0,
             cv::INTER_LINEAR);

  // Blend: foreground (mask=1) uses original, background (mask=0) uses blurred
  std::vector<uint8_t> outY(actualYStride * height);

  for (int row = 0; row < height; row++) {
    const uint8_t *srcY = yMat.ptr<uint8_t>(row);
    const uint8_t *blurY = yBlurred.ptr<uint8_t>(row);
    const float *maskRow = fullMask.ptr<float>(row);
    uint8_t *dstY = outY.data() + row * actualYStride;

    for (int col = 0; col < width; col++) {
      float prob = maskRow[col];
      // prob=1: foreground (person) = original
      // prob=0: background = blurred
      dstY[col] =
          static_cast<uint8_t>(blurY[col] * (1.0f - prob) + srcY[col] * prob);
    }
    // Copy stride padding if any
    if (actualYStride > width) {
      memcpy(dstY + width, ySrc + row * actualYStride + width,
             actualYStride - width);
    }
  }

  env->SetByteArrayRegion(outYData, 0, actualYStride * height,
                          reinterpret_cast<jbyte *>(outY.data()));

  env->ReleaseByteArrayElements(yData, yPtr, JNI_ABORT);
  env->ReleaseByteArrayElements(uData, uPtr, JNI_ABORT);
  env->ReleaseByteArrayElements(vData, vPtr, JNI_ABORT);

  return outYData;
}

// Keep old method for compatibility but mark deprecated
JNIEXPORT jfloatArray JNICALL
Java_com_executorch_webrtc_ExecutorchFrameProcessor_runSegmentation(
    JNIEnv *env, jobject thiz, jbyteArray rgbData, jint width, jint height) {
  LOGD("runSegmentation called (deprecated path): %dx%d", width, height);

  const int maskSize = width * height;
  jfloatArray result = env->NewFloatArray(maskSize);
  if (!result)
    return nullptr;

  std::vector<float> mask(maskSize, 0.5f);
  env->SetFloatArrayRegion(result, 0, maskSize, mask.data());
  return result;
}

} // extern "C"
