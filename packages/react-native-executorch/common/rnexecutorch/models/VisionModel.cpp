#include "VisionModel.h"
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/utils/FrameProcessor.h>

namespace rnexecutorch::models {

using namespace facebook;

cv::Mat VisionModel::extractFromFrame(jsi::Runtime &runtime,
                                      const jsi::Value &frameData) const {
  auto frameObj = frameData.asObject(runtime);
  return ::rnexecutorch::utils::extractFrame(runtime, frameObj);
}

cv::Mat VisionModel::extractFromPixels(const JSTensorViewIn &tensorView) const {
  if (tensorView.sizes.size() != 3) {
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Invalid pixel data: sizes must have 3 elements "
                  "[height, width, channels], got %zu",
                  tensorView.sizes.size());
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            errorMessage);
  }

  int32_t height = tensorView.sizes[0];
  int32_t width = tensorView.sizes[1];
  int32_t channels = tensorView.sizes[2];

  if (channels != 3) {
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Invalid pixel data: expected 3 channels (RGB), got %d",
                  channels);
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            errorMessage);
  }

  if (tensorView.scalarType != ScalarType::Byte) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidUserInput,
        "Invalid pixel data: scalarType must be BYTE (Uint8Array)");
  }

  uint8_t *dataPtr = static_cast<uint8_t *>(tensorView.dataPtr);
  cv::Mat image(height, width, CV_8UC3, dataPtr);

  return image;
}

} // namespace rnexecutorch::models
