#include "Decoder.h"
#include <rnexecutorch/Log.h>

namespace rnexecutorch::models::text_to_speech::kokoro {

using ::executorch::aten::ScalarType;
using ::executorch::extension::make_tensor_ptr;
using ::executorch::extension::TensorPtr;

Decoder::Decoder(const std::string &modelSource,
                 std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  auto inputTensors = getAllInputShapes();

  // Perform checks to validate model's compatibility with native code
  if (inputTensors.size() == 0) {
    throw std::runtime_error(
        "[Kokoro::Decoder] Model seems to not take any input tensors.");
  }
  std::vector<int32_t> modelInputShape = inputTensors[0];
  if (modelInputShape.size() < 4) {
    rnexecutorch::log(
        rnexecutorch::LOG_LEVEL::Error,
        "Unexpected model input size, expected at least 4 dimentions "
        "but got: ",
        modelInputShape.size());
    throw std::runtime_error("[Kokoro::Decoder] Incompatible model");
  }
}

Result<std::vector<EValue>>
Decoder::generate(const std::string &method, const Configuration &inputConfig,
                  std::span<float> asr, std::span<float> f0Pred,
                  std::span<float> nPred, std::span<float> ref_ls) {
  // Perform input shape checks
  // Both F0 and N vectors should be twice as long as duration
  if (f0Pred.size() != 2 * inputConfig.duration) {
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Error,
                      "Unexpected F0 vector length: expected ",
                      2 * inputConfig.duration, " but got ", f0Pred.size());
    throw std::runtime_error("[Kokoro::Decoder] Invalid input shape");
  }
  if (nPred.size() != 2 * inputConfig.duration) {
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Error,
                      "Unexpected N vector length: expected ",
                      2 * inputConfig.duration, " but got ", nPred.size());
    throw std::runtime_error("[Kokoro::Decoder] Invalid input shape");
  }
  // ref_hs should be a half of a voice reference vector
  if (ref_ls.size() != constants::kVoiceRefHalfSize) {
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Error,
                      "Unexpected voice ref length: expected ",
                      constants::kVoiceRefHalfSize, " but got ", ref_ls.size());
    throw std::runtime_error("[Kokoro::Decoder] Invalid input shape");
  }

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