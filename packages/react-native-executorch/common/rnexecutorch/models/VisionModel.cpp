#include "VisionModel.h"
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
  // Extract width, height, and channels
  if (!pixelData.hasProperty(runtime, "width") ||
      !pixelData.hasProperty(runtime, "height") ||
      !pixelData.hasProperty(runtime, "channels") ||
      !pixelData.hasProperty(runtime, "data")) {
    throw std::runtime_error(
        "Invalid pixel data: must contain width, height, channels, and data");
  }

  int width = pixelData.getProperty(runtime, "width").asNumber();
  int height = pixelData.getProperty(runtime, "height").asNumber();
  int channels = pixelData.getProperty(runtime, "channels").asNumber();

  // Get the ArrayBuffer
  auto dataValue = pixelData.getProperty(runtime, "data");
  if (!dataValue.isObject() ||
      !dataValue.asObject(runtime).isArrayBuffer(runtime)) {
    throw std::runtime_error(
        "pixel data 'data' property must be an ArrayBuffer");
  }

  auto arrayBuffer = dataValue.asObject(runtime).getArrayBuffer(runtime);
  size_t expectedSize = width * height * channels;

  if (arrayBuffer.size(runtime) != expectedSize) {
    throw std::runtime_error(
        "ArrayBuffer size does not match width * height * channels");
  }

  // Create cv::Mat and copy the data
  // OpenCV uses BGR/BGRA format internally, but we'll create as-is and let
  // preprocessFrame handle conversion
  int cvType = (channels == 3) ? CV_8UC3 : CV_8UC4;
  cv::Mat image(height, width, cvType);

  // Copy data from ArrayBuffer to cv::Mat
  std::memcpy(image.data, arrayBuffer.data(runtime), expectedSize);

  return image;
}

} // namespace models
} // namespace rnexecutorch
