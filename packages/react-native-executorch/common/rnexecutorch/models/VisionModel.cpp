#include "VisionModel.h"
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/utils/FrameProcessor.h>
#include <rnexecutorch/utils/FrameTransform.h>

namespace rnexecutorch::models {

using namespace facebook;

VisionModel::VisionModel(const std::string &modelSource,
                         std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {}

void VisionModel::unload() noexcept {
  std::scoped_lock lock(inference_mutex_);
  BaseModel::unload();
}

cv::Size VisionModel::modelInputSize() const {
  if (modelInputShape_.size() < 2) {
    return {0, 0};
  }
  return cv::Size(modelInputShape_[modelInputShape_.size() - 1],
                  modelInputShape_[modelInputShape_.size() - 2]);
}

cv::Mat VisionModel::extractFromFrame(jsi::Runtime &runtime,
                                      const jsi::Value &frameData) const {
  cv::Mat frame = ::rnexecutorch::utils::frameToMat(runtime, frameData);
  cv::Mat rgb;
#ifdef __APPLE__
  cv::cvtColor(frame, rgb, cv::COLOR_BGRA2RGB);
#else
  cv::cvtColor(frame, rgb, cv::COLOR_RGBA2RGB);
#endif
  return rgb;
}

cv::Mat VisionModel::preprocess(const cv::Mat &image) const {
  const cv::Size targetSize = modelInputSize();
  if (image.size() == targetSize) {
    return image;
  }
  cv::Mat resized;
  cv::resize(image, resized, targetSize);
  return resized;
}

cv::Mat VisionModel::extractFromPixels(const JSTensorViewIn &tensorView) const {
  return ::rnexecutorch::utils::pixelsToMat(tensorView);
}

utils::FrameOrientation VisionModel::extractFrameOrientation(
    jsi::Runtime &runtime, const jsi::Value &frameData) const {
  return ::rnexecutorch::utils::readFrameOrientation(runtime, frameData);
}

} // namespace rnexecutorch::models
