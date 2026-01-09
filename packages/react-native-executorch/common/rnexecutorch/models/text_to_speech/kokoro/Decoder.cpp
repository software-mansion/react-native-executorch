#include "Decoder.h"
#include <rnexecutorch/Log.h>
#include <rnexecutorch/metaprogramming/ContainerHelpers.h>

namespace rnexecutorch::models::text_to_speech::kokoro {

using ::executorch::aten::ScalarType;
using ::executorch::extension::make_tensor_ptr;
using ::executorch::extension::TensorPtr;

Decoder::Decoder(const std::string &modelSource,
                 std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  std::string testMethod =
      "forward_" + std::to_string(constants::kInputSmall.noTokens);
  auto inputTensors = getAllInputShapes(testMethod);

  // Perform checks to validate model's compatibility with native code
  CHECK_SIZE(inputTensors, 4);
}

Result<std::vector<EValue>>
Decoder::generate(const std::string &method, const Configuration &inputConfig,
                  std::span<float> asr, std::span<float> f0Pred,
                  std::span<float> nPred, std::span<float> ref_ls) {
  // Perform input shape checks
  // Both F0 and N vectors should be twice as long as duration
  CHECK_SIZE(f0Pred, 2 * inputConfig.duration);
  CHECK_SIZE(nPred, 2 * inputConfig.duration);
  CHECK_SIZE(ref_ls, constants::kVoiceRefHalfSize);

  // Convert input data to ExecuTorch tensors
  auto asrTensor = make_tensor_ptr({1, 512, inputConfig.duration}, asr.data(),
                                   ScalarType::Float);
  auto f0Tensor = make_tensor_ptr({1, 2 * inputConfig.duration}, f0Pred.data(),
                                  ScalarType::Float);
  auto nTensor = make_tensor_ptr({1, 2 * inputConfig.duration}, nPred.data(),
                                 ScalarType::Float);
  auto voiceRefTensor = make_tensor_ptr({1, constants::kVoiceRefHalfSize},
                                        ref_ls.data(), ScalarType::Float);

  // Execute the appropriate "forward_xyz" method, based on given method name
  auto results =
      execute(method, {asrTensor, f0Tensor, nTensor, voiceRefTensor});

  if (!results.ok()) {
    throw std::runtime_error(
        "[Kokoro::Decoder] Failed to execute method " + method +
        ", error: " + std::to_string(static_cast<uint32_t>(results.error())));
  }

  // [audio]
  return results;
}

} // namespace rnexecutorch::models::text_to_speech::kokoro