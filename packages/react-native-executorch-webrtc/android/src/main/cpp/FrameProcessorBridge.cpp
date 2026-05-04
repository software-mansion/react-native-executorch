#include <android/log.h>
#include <jni.h>
#include <memory>
#include <mutex>
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

namespace {

// Bundles the segmentation instance with the dims read from it. Held by
// shared_ptr so an in-flight runSegmentation keeps the model alive even if
// unloadModel runs concurrently on another thread (no UAF), and load->run
// publication is via the mutex (no torn reads / null-deref races).
struct LoadedModel {
  std::unique_ptr<BaseSemanticSegmentation> segmentation;
  int32_t modelWidth = 256;
  int32_t modelHeight = 256;
};

std::mutex g_modelMutex;
std::shared_ptr<LoadedModel> g_model; // null when unloaded

std::shared_ptr<LoadedModel> snapshotModel() {
  std::lock_guard<std::mutex> lock(g_modelMutex);
  return g_model;
}

// Mask post-processing state (EMA temporal smoothing). Touched only on the
// capture thread; unload resets it.
cv::Mat g_previousMask;
bool g_hasHistory = false;
constexpr float EMA_ALPHA = 0.5f;

cv::Mat rotateMat(const cv::Mat &src, int rotation) {
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

} // namespace

extern "C" {

JNIEXPORT jboolean JNICALL
Java_com_executorch_webrtc_ExecutorchFrameProcessor_loadModel(
    JNIEnv *env, jobject thiz, jstring modelPath) {
  const char *pathChars = env->GetStringUTFChars(modelPath, nullptr);
  if (pathChars == nullptr) {
    LOGE("Failed to get model path string");
    return JNI_FALSE;
  }
  std::string path(pathChars);
  env->ReleaseStringUTFChars(modelPath, pathChars);

  LOGD("Loading segmentation model: %s", path.c_str());

  try {
    std::vector<float> normMean = {};
    std::vector<float> normStd = {};
    std::vector<std::string> allClasses = {"foreground", "background"};

    auto loaded = std::make_shared<LoadedModel>();
    loaded->segmentation = std::make_unique<BaseSemanticSegmentation>(
        path, normMean, normStd, allClasses, nullptr);

    auto inputShapes = loaded->segmentation->getAllInputShapes();
    if (!inputShapes.empty() && inputShapes[0].size() >= 4) {
      loaded->modelHeight = inputShapes[0][inputShapes[0].size() - 2];
      loaded->modelWidth = inputShapes[0][inputShapes[0].size() - 1];
    }
    LOGD("Model input size: %dx%d", loaded->modelWidth, loaded->modelHeight);

    {
      std::lock_guard<std::mutex> lock(g_modelMutex);
      g_model = std::move(loaded);
    }

    LOGD("Segmentation model loaded successfully!");
    return JNI_TRUE;
  } catch (const std::exception &e) {
    LOGE("Failed to load model: %s", e.what());
    return JNI_FALSE;
  }
}

JNIEXPORT jbyteArray JNICALL
Java_com_executorch_webrtc_ExecutorchFrameProcessor_runSegmentation(
    JNIEnv *env, jobject thiz, jbyteArray rgbaData, jint width, jint height,
    jint rotation) {
  // Snapshot under the mutex so a concurrent unloadModel can't free the model
  // out from under us — the local shared_ptr keeps it alive for this call.
  auto model = snapshotModel();
  if (!model) {
    LOGE("Model not loaded, cannot run segmentation");
    return nullptr;
  }

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
    auto result = model->segmentation->generateFromPixels(
        pixelData, classesOfInterest, false);

    cv::Mat mask;
    if (result.classBuffers && result.classBuffers->count("foreground")) {
      auto &fgBuffer = result.classBuffers->at("foreground");
      auto *fgData = reinterpret_cast<float *>(fgBuffer->data());
      mask = cv::Mat(model->modelHeight, model->modelWidth, CV_32FC1, fgData)
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

    if (!g_hasHistory || g_previousMask.size() != mask.size()) {
      g_previousMask = mask.clone();
      g_hasHistory = true;
    } else {
      cv::addWeighted(g_previousMask, EMA_ALPHA, mask, 1.0f - EMA_ALPHA, 0,
                      g_previousMask);
      mask = g_previousMask.clone();
    }

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

    cv::Mat maskResized;
    cv::resize(maskRotated, maskResized, cv::Size(width, height), 0, 0,
               cv::INTER_LINEAR);

    cv::Mat maskBytes;
    maskResized.convertTo(maskBytes, CV_8UC1, 255.0);

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

JNIEXPORT void JNICALL
Java_com_executorch_webrtc_ExecutorchFrameProcessor_unloadModel(JNIEnv *env,
                                                                jobject thiz) {
  LOGD("Unloading segmentation model");

  // Drop the publication ref. Any in-flight runSegmentation holds its own
  // shared_ptr and will keep the underlying segmentation alive until it
  // returns, then release it.
  {
    std::lock_guard<std::mutex> lock(g_modelMutex);
    g_model.reset();
  }

  g_previousMask.release();
  g_hasHistory = false;

  LOGD("Model unloaded");
}

} // extern "C"
