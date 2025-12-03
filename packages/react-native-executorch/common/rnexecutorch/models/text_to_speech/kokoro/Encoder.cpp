#include "Encoder.h"
#include <rnexecutorch/Log.h>

namespace rnexecutorch::models::text_to_speech::kokoro {

using ::executorch::aten::ScalarType;
using ::executorch::extension::make_tensor_ptr;
using ::executorch::extension::TensorPtr;

Encoder::Encoder(const std::string &modelSource,
                 std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  auto inputTensors = getAllInputShapes();

  // Perform checks to validate model's compatibility with native code
  if (inputTensors.size() == 0) {
    throw std::runtime_error(
        "[Kokoro::Encoder] Model seems to not take any input tensors.");
  }
  std::vector<int32_t> modelInputShape = inputTensors[0];
  if (modelInputShape.size() < 3) {
    rnexecutorch::log(
        rnexecutorch::LOG_LEVEL::Error,
        "Unexpected model input size, expected at least 3 dimentions "
        "but got: ",
        modelInputShape.size());
    throw std::runtime_error("[Kokoro::Encoder] Incompatible model");
  }
}

Result<std::vector<EValue>> Encoder::generate(const std::string &method,
                                              std::span<int64_t> tokens,
                                              std::span<int64_t> textMask) {
  // Perform input shape checks
  // Since every bit in text mask corresponds to exactly one of the tokens, both
  // vectors should be the same length
  if (tokens.size() != textMask.size()) {
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Error,
                      "Unexpected text mask length: expected ", tokens.size(),
                      " but got ", textMask.size());
    throw std::runtime_error("[Kokoro::Encoder] Invalid input shape");
  }

  // Convert input data to ExecuTorch tensors
  int64_t noTokens = static_cast<int64_t>(tokens.size());
  auto tokensTensor = make_tensor_ptr({1, static_cast<int32_t>(tokens.size())},
                                      tokens.data(), ScalarType::Long);
  auto noTokensTensor = make_tensor_ptr({1}, &noTokens, ScalarType::Long);
  auto textMaskTensor =
      make_tensor_ptr({1, static_cast<int32_t>(textMask.size())},
                      textMask.data(), ScalarType::Long);

  // Execute the appropriate "forward_xyz" method, based on given method name
  auto results =
      execute(method, {tokensTensor, noTokensTensor, textMaskTensor});

  if (!results.ok()) {
    throw std::runtime_error(
        "[Kokoro::Encoder] Failed to execute method " + method +
        ", error: " + std::to_string(static_cast<uint32_t>(results.error())));
  }

  // [text_encoded]
  return results;
}

} // namespace rnexecutorch::models::text_to_speech::kokoro