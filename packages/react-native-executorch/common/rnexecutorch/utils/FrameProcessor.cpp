#include "FrameProcessor.h"
#include "FrameExtractor.h"
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>

namespace rnexecutorch::utils {

namespace {

bool hasNativeBuffer(jsi::Runtime &runtime, const jsi::Object &frameData) {
  return frameData.hasProperty(runtime, "nativeBuffer");
}

} // namespace

cv::Mat extractFrame(jsi::Runtime &runtime, const jsi::Object &frameData) {
  if (!hasNativeBuffer(runtime, frameData)) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            "FrameProcessor: No nativeBuffer found in frame");
  }

  auto nativeBufferValue = frameData.getProperty(runtime, "nativeBuffer");
  uint64_t bufferPtr = static_cast<uint64_t>(
      nativeBufferValue.asBigInt(runtime).asUint64(runtime));

  return extractFromNativeBuffer(bufferPtr);
}
} // namespace rnexecutorch::utils
