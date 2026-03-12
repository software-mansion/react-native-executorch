#include "VisionModel.h"
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/utils/FrameProcessor.h>

namespace rnexecutorch::models {

using namespace facebook;

cv::Mat VisionModel::extractFromFrame(jsi::Runtime &runtime,
                                      const jsi::Value &frameData) const {
  return ::rnexecutorch::utils::frameToMat(runtime, frameData);
}

cv::Mat VisionModel::preprocessFrame(const cv::Mat &frame) const {
  cv::Mat rgb;

  if (frame.channels() == 4) {
#ifdef __APPLE__
    cv::cvtColor(frame, rgb, cv::COLOR_BGRA2RGB);
#else
    cv::cvtColor(frame, rgb, cv::COLOR_RGBA2RGB);
#endif
  } else if (frame.channels() == 3) {
    rgb = frame;
  } else {
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Unsupported frame format: %d channels", frame.channels());
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            errorMessage);
  }

  const cv::Size targetSize = modelInputSize();
  if (rgb.size() != targetSize) {
    cv::Mat resized;
    cv::resize(rgb, resized, targetSize);
    return resized;
  }

  return rgb;
}

cv::Mat VisionModel::extractFromPixels(const JSTensorViewIn &tensorView) const {
  return ::rnexecutorch::utils::pixelsToMat(tensorView);
}

} // namespace rnexecutorch::models
