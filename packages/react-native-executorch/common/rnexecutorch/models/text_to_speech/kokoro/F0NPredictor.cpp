#include "F0NPredictor.h"
#include <rnexecutorch/Log.h>
#include <rnexecutorch/metaprogramming/ContainerHelpers.h>

namespace rnexecutorch::models::text_to_speech::kokoro {

using ::executorch::aten::ScalarType;
using ::executorch::extension::make_tensor_ptr;
using ::executorch::extension::TensorPtr;

F0NPredictor::F0NPredictor(const std::string &modelSource,
                           std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  const std::string testMethod =
      "forward_" + std::to_string(constants::kInputSmall.noTokens);
  const auto inputTensors = getAllInputShapes(testMethod);

  // Perform checks to validate model's compatibility with native code
  CHECK_SIZE(inputTensors, 3);
}

Result<std::vector<EValue>> F0NPredictor::generate(
    const std::string &method, const Configuration &inputConfig,
    std::span<int64_t> indices, std::span<float> dur, std::span<float> ref_hs) {
  // Perform input shape checks
  // s vector should be half of a voice reference vector size
  CHECK_SIZE(ref_hs, constants::kVoiceRefHalfSize);

  // Convert input data to ExecuTorch tensors
  auto indicesTensor =
      make_tensor_ptr({inputConfig.duration}, indices.data(), ScalarType::Long);
  auto durTensor = make_tensor_ptr({1, inputConfig.noTokens, 640}, dur.data(),
                                   ScalarType::Float);
  auto voiceRefTensor = make_tensor_ptr({1, constants::kVoiceRefHalfSize},
                                        ref_hs.data(), ScalarType::Float);

  // Execute the appropriate "forward_xyz" method, based on given method name
  auto results = execute(method, {indicesTensor, durTensor, voiceRefTensor});

  if (!results.ok()) {
    throw std::runtime_error(
        "[Kokoro::DurationPredictor] Failed to execute method " + method +
        ", error: " + std::to_string(static_cast<uint32_t>(results.error())));
  }

  // Returns F0 prediction, N prediction, and related features (en,
  // pred_aln_trg)
  return results;
}

} // namespace rnexecutorch::models::text_to_speech::kokoro