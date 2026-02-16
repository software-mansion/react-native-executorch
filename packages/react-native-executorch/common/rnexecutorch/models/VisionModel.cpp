#include "VisionModel.h"
#include <rnexecutorch/utils/FrameProcessor.h>

namespace rnexecutorch {
namespace models {

using namespace facebook;

cv::Mat VisionModel::extractAndPreprocess(jsi::Runtime &runtime,
                                          const jsi::Value &frameData) const {
  // Extract frame using FrameProcessor utility
  auto frameObj = frameData.asObject(runtime);
  cv::Mat frame = utils::FrameProcessor::extractFrame(runtime, frameObj);

  // Apply model-specific preprocessing
  return preprocessFrame(frame);
}

} // namespace models
} // namespace rnexecutorch
