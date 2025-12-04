#include "F0NPredictor.h"
#include <rnexecutorch/Log.h>

namespace rnexecutorch::models::text_to_speech::kokoro {

using ::executorch::aten::ScalarType;
using ::executorch::extension::make_tensor_ptr;
using ::executorch::extension::TensorPtr;

F0NPredictor::F0NPredictor(const std::string &modelSource,
                           std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  auto inputTensors = getAllInputShapes();

  // Perform checks to validate model's compatibility with native code
  if (inputTensors.size() == 0) {
    throw std::runtime_error(
        "[Kokoro::F0NPredictor] Model seems to not take any input tensors.");
  }
  std::vector<int32_t> modelInputShape = inputTensors[0];
  if (modelInputShape.size() < 2) {
    rnexecutorch::log(
        rnexecutorch::LOG_LEVEL::Error,
        "Unexpected model input size, expected at least 2 dimentions "
        "but got: ",
        modelInputShape.size());
    throw std::runtime_error("[Kokoro::F0NPredictor] Incompatible model");
  }
}

Result<std::vector<EValue>> F0NPredictor::generate(
    const std::string &method, const Configuration &inputConfig,
    std::span<int64_t> indices, std::span<float> dur, std::span<float> ref_hs) {
  // Perform input shape checks
  // s vector should be half of a voice reference vector size
  if (ref_hs.size() != constants::kVoiceRefHalfSize) {
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Error,
                      "Unexpected voice ref length: expected ",
                      constants::kVoiceRefHalfSize, " but got ", ref_hs.size());
    throw std::runtime_error("[Kokoro::F0NPredictor] Invalid input shape");
  }

  // Convert input data to ExecuTorch tensors
  auto indicesTensor =
      make_tensor_ptr({inputConfig.duration}, indices.data(), ScalarType::Long);
  auto durTensor = make_tensor_ptr({1, inputConfig.noTokens, 640},
                                   indices.data(), ScalarType::Float);
  auto voiceRefTensor = make_tensor_ptr({1, constants::kVoiceRefHalfSize},
                                        ref_hs.data(), ScalarType::Float);

  // Execute the appropriate "forward_xyz" method, based on given method name
  auto results = execute(method, {indicesTensor, durTensor, voiceRefTensor});

  if (!results.ok()) {
    throw std::runtime_error(
        "[Kokoro::DurationPredictor] Failed to execute method " + method +
        ", error: " + std::to_string(static_cast<uint32_t>(results.error())));
  }

  // [F0_pred, N_pred, en, pred_alg_trn]
  return results;
}

} // namespace rnexecutorch::models::text_to_speech::kokoro