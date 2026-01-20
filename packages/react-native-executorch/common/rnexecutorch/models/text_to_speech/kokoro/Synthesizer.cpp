#include "Synthesizer.h"
#include <rnexecutorch/Log.h>
#include <rnexecutorch/metaprogramming/ContainerHelpers.h>

namespace rnexecutorch::models::text_to_speech::kokoro {

using ::executorch::aten::ScalarType;
using ::executorch::extension::make_tensor_ptr;
using ::executorch::extension::TensorPtr;

Synthesizer::Synthesizer(const std::string &modelSource,
                         const Context &modelContext,
                         std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker), context_(modelContext) {
  const auto inputTensors = getAllInputShapes("forward");

  // Perform checks to validate model's compatibility with native code
  CHECK_SIZE(inputTensors, 5);
  CHECK_SIZE(
      inputTensors[0],
      2); // input tokens must be of shape {1, T}, where T is number of tokens
  CHECK_SIZE(
      inputTensors[1],
      2); // text mask must be of shape {1, T}, where T is number of tokens
  CHECK_SIZE(inputTensors[2],
             1); // indices must be of shape {D}, where D is a maximum duration
}

Result<std::vector<EValue>> Synthesizer::generate(std::span<const Token> tokens,
                                                  std::span<bool> textMask,
                                                  std::span<int64_t> indices,
                                                  std::span<float> dur,
                                                  std::span<float> ref_s) {
  // Perform input shape checks
  // Both F0 and N vectors should be twice as long as duration
  CHECK_SIZE(tokens, textMask.size());
  CHECK_SIZE(ref_s, constants::kVoiceRefSize);

  int32_t noTokens = tokens.size();
  int32_t duration = indices.size();

  // Convert input data to ExecuTorch tensors
  auto tokensTensor =
      make_tensor_ptr({1, static_cast<int32_t>(tokens.size())},
                      const_cast<Token *>(tokens.data()), ScalarType::Long);
  auto textMaskTensor =
      make_tensor_ptr({1, static_cast<int32_t>(textMask.size())},
                      textMask.data(), ScalarType::Bool);
  auto indicesTensor =
      make_tensor_ptr({duration}, indices.data(), ScalarType::Long);
  auto durTensor =
      make_tensor_ptr({1, noTokens, 640}, dur.data(), ScalarType::Float);
  auto voiceRefTensor = make_tensor_ptr({1, constants::kVoiceRefSize},
                                        ref_s.data(), ScalarType::Float);

  // Execute the appropriate "forward_xyz" method, based on given method name
  auto results = forward(
      {tokensTensor, textMaskTensor, indicesTensor, durTensor, voiceRefTensor});

  if (!results.ok()) {
    throw std::runtime_error(
        "[Kokoro::Synthesizer] Failed to execute method forward"
        ", error: " +
        std::to_string(static_cast<uint32_t>(results.error())));
  }

  // Returns a single [audio] vector, which contains the
  // resulting audio data in PCM (Pulse-Code Modulation) format.
  return results;
}

size_t Synthesizer::getTokensLimit() const {
  // Returns tokens input (shape {1, T}) second dim
  return getInputShape("forward", 0)[1];
}

size_t Synthesizer::getDurationLimit() const {
  // Returns indices vector first dim (shape {D})
  return getInputShape("forward", 2)[0];
}

} // namespace rnexecutorch::models::text_to_speech::kokoro