#include <android/log.h>
#include <jni.h>
#include <memory>
#include <opencv2/opencv.hpp>
#include <set>
#include <string>
#include <vector>

#include <rnexecutorch/host_objects/JSTensorViewIn.h>
#include <rnexecutorch/models/semantic_segmentation/BaseSemanticSegmentation.h>

#define LOG_TAG "ExecutorchWebRTC-JNI"
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

using namespace rnexecutorch;
using namespace rnexecutorch::models::semantic_segmentation;

namespace {

constexpr float EMA_ALPHA = 0.5f;

// Per-instance native state. Returned as an opaque jlong from loadModel and
// taken back by run/unload. Kotlin holds a single lock that serializes every
// JNI call on a given handle, so this struct needs no internal synchronization.
struct ProcessorHandle {
  std::unique_ptr<BaseSemanticSegmentation> segmentation;
  int32_t modelWidth = 256;
  int32_t modelHeight = 256;
  cv::Mat previousMask;
  bool hasHistory = false;
};

cv::Mat rotateMat(const cv::Mat &src, int32_t rotation) {
  cv::Mat dst;
  if (rotation == 90) {
    cv::rotate(src, dst, cv::ROTATE_90_CLOCKWISE);
  } else if (rotation == 180) {
    cv::rotate(src, dst, cv::ROTATE_180);
  } else if (rotation == 270) {
    cv::rotate(src, dst, cv::ROTATE_90_COUNTERCLOCKWISE);
  } else {
    dst = src;
  }
  return dst;
}

cv::Mat unrotateMat(const cv::Mat &src, int32_t rotation) {
  cv::Mat dst;
  if (rotation == 90) {
    cv::rotate(src, dst, cv::ROTATE_90_COUNTERCLOCKWISE);
  } else if (rotation == 180) {
    cv::rotate(src, dst, cv::ROTATE_180);
  } else if (rotation == 270) {
    cv::rotate(src, dst, cv::ROTATE_90_CLOCKWISE);
  } else {
    dst = src;
  }
  return dst;
}

} // namespace

extern "C" {

JNIEXPORT jlong JNICALL
Java_com_executorch_webrtc_ExecutorchFrameProcessor_loadModel(
    JNIEnv *env, jobject thiz, jstring modelPath) {
  const char *pathChars = env->GetStringUTFChars(modelPath, nullptr);
  if (pathChars == nullptr) {
    LOGE("Failed to get model path string");
    return 0;
  }
  std::string path(pathChars);
  env->ReleaseStringUTFChars(modelPath, pathChars);

  LOGD("Loading segmentation model: %s", path.c_str());

  try {
    std::vector<float> normMean = {};
    std::vector<float> normStd = {};
    std::vector<std::string> allClasses = {"foreground", "background"};

    auto handle = std::make_unique<ProcessorHandle>();
    handle->segmentation = std::make_unique<BaseSemanticSegmentation>(
        path, normMean, normStd, allClasses, nullptr);

    auto inputShapes = handle->segmentation->getAllInputShapes();
    if (!inputShapes.empty() && inputShapes[0].size() >= 4) {
      handle->modelHeight = inputShapes[0][inputShapes[0].size() - 2];
      handle->modelWidth = inputShapes[0][inputShapes[0].size() - 1];
    }
    LOGD("Model input size: %dx%d", handle->modelWidth, handle->modelHeight);
    LOGD("Segmentation model loaded successfully!");
    return reinterpret_cast<jlong>(handle.release());
  } catch (const std::exception &e) {
    LOGE("Failed to load model: %s", e.what());
    return 0;
  }
}

JNIEXPORT jbyteArray JNICALL
Java_com_executorch_webrtc_ExecutorchFrameProcessor_runSegmentation(
    JNIEnv *env, jobject thiz, jlong handlePtr, jbyteArray rgbaData, jint width,
    jint height, jint rotation) {
  if (handlePtr == 0) {
    return nullptr;
  }
  auto *handle = reinterpret_cast<ProcessorHandle *>(handlePtr);

  jbyte *rgbaPtr = env->GetByteArrayElements(rgbaData, nullptr);
  if (!rgbaPtr) {
    LOGE("Failed to get RGBA data pointer");
    return nullptr;
  }

  try {
    cv::Mat rgba(height, width, CV_8UC4, reinterpret_cast<uint8_t *>(rgbaPtr));
    cv::Mat rgb;
    cv::cvtColor(rgba, rgb, cv::COLOR_RGBA2RGB);

    cv::Mat rgbRotated = rotateMat(rgb, rotation);

    JSTensorViewIn pixelData;
    pixelData.dataPtr = rgbRotated.data;
    pixelData.sizes = {rgbRotated.rows, rgbRotated.cols, 3};
    pixelData.scalarType = executorch::aten::ScalarType::Byte;

    std::set<std::string, std::less<>> classesOfInterest = {"foreground"};
    auto result = handle->segmentation->generateFromPixels(
        pixelData, classesOfInterest, false);

    cv::Mat mask;
    if (result.classBuffers && result.classBuffers->count("foreground")) {
      auto &fgBuffer = result.classBuffers->at("foreground");
      auto *fgData = reinterpret_cast<float *>(fgBuffer->data());
      mask = cv::Mat(handle->modelHeight, handle->modelWidth, CV_32FC1, fgData)
                 .clone();
    } else {
      LOGE("No foreground mask in result");
      env->ReleaseByteArrayElements(rgbaData, rgbaPtr, JNI_ABORT);
      return nullptr;
    }

    cv::threshold(mask, mask, 0.5, 1.0, cv::THRESH_BINARY);
    cv::Mat kernel = cv::getStructuringElement(cv::MORPH_RECT, cv::Size(3, 3));
    cv::erode(mask, mask, kernel);
    cv::dilate(mask, mask, kernel);

    if (!handle->hasHistory || handle->previousMask.size() != mask.size()) {
      handle->previousMask = mask.clone();
      handle->hasHistory = true;
    } else {
      cv::addWeighted(handle->previousMask, EMA_ALPHA, mask, 1.0f - EMA_ALPHA,
                      0, handle->previousMask);
      mask = handle->previousMask.clone();
    }

    cv::Mat maskRotated = unrotateMat(mask, rotation);

    cv::Mat maskResized;
    cv::resize(maskRotated, maskResized, cv::Size(width, height), 0, 0,
               cv::INTER_LINEAR);

    cv::Mat maskBytes;
    maskResized.convertTo(maskBytes, CV_8UC1, 255.0);

    const int32_t maskSize = width * height;
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

JNIEXPORT void JNICALL
Java_com_executorch_webrtc_ExecutorchFrameProcessor_unloadModel(
    JNIEnv *env, jobject thiz, jlong handlePtr) {
  if (handlePtr == 0) {
    return;
  }
  // Kotlin's lock guarantees no concurrent runSegmentation on this handle.
  delete reinterpret_cast<ProcessorHandle *>(handlePtr);
  LOGD("Model unloaded");
}

} // extern "C"
