#include "VisionModel.h"
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/utils/FrameProcessor.h>

namespace rnexecutorch::models {

using namespace facebook;

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

} // namespace rnexecutorch::models
