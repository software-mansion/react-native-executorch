#include "Synthesizer.h"
#include <rnexecutorch/Error.h>
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
  // Discover all forward methods (forward, forward_8, forward_32, etc.)
  auto availableMethods = module_->method_names();
  if (availableMethods.ok()) {
    const auto &names = *availableMethods;
    for (const auto &name : names) {
      if (name.rfind("forward", 0) == 0) {
        const auto inputTensors = getAllInputShapes(name);
        CHECK_SIZE(inputTensors, 5);
        CHECK_SIZE(inputTensors[0], 2);
        CHECK_SIZE(inputTensors[1], 2);
        CHECK_SIZE(inputTensors[2], 1);
        size_t inputSize = inputTensors[0][1];
        forwardMethods_.emplace_back(name, inputSize);
      }
    }
    std::stable_sort(forwardMethods_.begin(), forwardMethods_.end(),
                     [](const auto &a, const auto &b) { return a.second < b.second; });
  }

  // Fallback: if no methods discovered, validate "forward" directly
  if (forwardMethods_.empty()) {
    const auto inputTensors = getAllInputShapes("forward");
    CHECK_SIZE(inputTensors, 5);
    CHECK_SIZE(inputTensors[0], 2);
    CHECK_SIZE(inputTensors[1], 2);
    CHECK_SIZE(inputTensors[2], 1);
    forwardMethods_.emplace_back("forward", inputTensors[0][1]);
  }
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

  // Select appropriate forward method based on token count
  auto it = std::find_if(forwardMethods_.begin(), forwardMethods_.end(),
      [noTokens](const auto &entry) { return static_cast<int32_t>(entry.second) >= noTokens; });
  std::string selectedMethod = (it != forwardMethods_.end()) ? it->first : forwardMethods_.back().first;

  // Execute the selected forward method
  auto results = execute(selectedMethod,
      {tokensTensor, textMaskTensor, indicesTensor, durTensor, voiceRefTensor});

  if (!results.ok()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidModelOutput,
        "[Kokoro::Synthesizer] Failed to execute method " + selectedMethod +
        ", error: " +
            std::to_string(static_cast<uint32_t>(results.error())));
  }

  // Returns a single [audio] vector, which contains the
  // resulting audio data in PCM (Pulse-Code Modulation) format.
  return results;
}

size_t Synthesizer::getTokensLimit() const {
  return forwardMethods_.empty() ? 0 : forwardMethods_.back().second;
}

size_t Synthesizer::getDurationLimit() const {
  if (forwardMethods_.empty()) return 0;
  return getInputShape(forwardMethods_.back().first, 2)[0];
}

} // namespace rnexecutorch::models::text_to_speech::kokoro