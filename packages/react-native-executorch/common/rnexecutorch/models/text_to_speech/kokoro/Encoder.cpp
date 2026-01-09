#include "Encoder.h"
#include <rnexecutorch/Log.h>
#include <rnexecutorch/metaprogramming/ContainerHelpers.h>

namespace rnexecutorch::models::text_to_speech::kokoro {

using ::executorch::aten::ScalarType;
using ::executorch::extension::make_tensor_ptr;
using ::executorch::extension::TensorPtr;

Encoder::Encoder(const std::string &modelSource,
                 std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  std::string testMethod =
      "forward_" + std::to_string(constants::kInputSmall.noTokens);
  auto inputTensors = getAllInputShapes(testMethod);

  // Perform checks to validate model's compatibility with native code
  CHECK_SIZE(inputTensors, 3);
}

Result<std::vector<EValue>> Encoder::generate(const std::string &method,
                                              const Configuration &inputConfig,
                                              std::span<Token> tokens,
                                              std::span<bool> textMask,
                                              std::span<float> pred_aln_trg) {
  // Perform input shape checks
  // Since every bit in text mask corresponds to exactly one of the tokens, both
  // vectors should be the same length
  CHECK_SIZE(tokens, textMask.size());

  // Convert input data to ExecuTorch tensors
  int32_t noTokens = static_cast<int32_t>(tokens.size());
  auto tokensTensor = make_tensor_ptr({1, static_cast<int32_t>(tokens.size())},
                                      tokens.data(), ScalarType::Long);
  auto textMaskTensor =
      make_tensor_ptr({1, static_cast<int32_t>(textMask.size())},
                      textMask.data(), ScalarType::Bool);
  auto predAlnTrgTensor =
      make_tensor_ptr({1, noTokens, inputConfig.duration}, pred_aln_trg.data(),
                      ScalarType::Float);

  // Execute the appropriate "forward_xyz" method, based on given method name
  auto results =
      execute(method, {tokensTensor, textMaskTensor, predAlnTrgTensor});

  if (!results.ok()) {
    throw std::runtime_error(
        "[Kokoro::Encoder] Failed to execute method " + method +
        ", error: " + std::to_string(static_cast<uint32_t>(results.error())));
  }

  // [asr]
  return results;
}

} // namespace rnexecutorch::models::text_to_speech::kokoro