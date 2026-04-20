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
    LOGD("Segmentation model loaded successfully via "
         "BaseSemanticSegmentation!");
    return JNI_TRUE;
  } catch (const std::exception &e) {
    LOGE("Failed to load model: %s", e.what());
    g_modelLoaded = false;
    g_segmentation.reset();
    return JNI_FALSE;
  }
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

/**
 * Unload the segmentation model and release all buffers
 */
JNIEXPORT void JNICALL
Java_com_executorch_webrtc_ExecutorchFrameProcessor_unloadModel(JNIEnv *env,
                                                                jobject thiz) {
  LOGD("Unloading segmentation model and releasing resources");

  g_segmentation.reset();
  g_modelLoaded = false;
  g_modelPath.clear();

  // Release pre-allocated buffers
  g_resizedRgb.release();

  LOGD("Model unloaded and resources released");
}
} // extern "C"
