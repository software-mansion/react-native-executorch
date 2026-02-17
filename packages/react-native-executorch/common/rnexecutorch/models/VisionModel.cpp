#include "VisionModel.h"
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/host_objects/JSTensorViewIn.h>
#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/utils/FrameProcessor.h>

namespace rnexecutorch {
namespace models {

using namespace facebook;

cv::Mat VisionModel::extractFromFrame(jsi::Runtime &runtime,
                                      const jsi::Value &frameData) const {
  // Extract frame using FrameProcessor utility
  auto frameObj = frameData.asObject(runtime);
  cv::Mat frame = utils::FrameProcessor::extractFrame(runtime, frameObj);

  // Apply model-specific preprocessing
  return preprocessFrame(frame);
}

cv::Mat VisionModel::extractFromPixels(jsi::Runtime &runtime,
                                       const jsi::Object &pixelData) const {
  // PixelData follows TensorPtr structure (dataPtr, sizes, scalarType)
  // Use JSI conversion helper to extract the data
  auto tensorView = jsi::fromHostObject<JSTensorViewIn>(runtime, pixelData);

  // Validate dimensions: sizes must be [height, width, channels]
  if (tensorView.sizes.size() != 3) {
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Invalid pixel data: sizes must have 3 elements "
                  "[height, width, channels], got %zu",
                  tensorView.sizes.size());
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            errorMessage);
  }

  int height = tensorView.sizes[0];
  int width = tensorView.sizes[1];
  int channels = tensorView.sizes[2];

  // Pixel data must be RGB (3 channels) and BYTE type
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

  // Create cv::Mat directly from dataPtr (zero-copy view)
  uint8_t *dataPtr = static_cast<uint8_t *>(tensorView.dataPtr);
  cv::Mat image(height, width, CV_8UC3, dataPtr);

  // Clone to own the data, since JS memory may be GC'd
  return image.clone();
}

} // namespace models
} // namespace rnexecutorch
