#include "DurationPredictor.h"
#include <cmath>
#include <numeric>
#include <queue>
#include <rnexecutorch/Log.h>

namespace rnexecutorch::models::text_to_speech::kokoro {

using ::executorch::aten::ScalarType;
using ::executorch::extension::make_tensor_ptr;
using ::executorch::extension::TensorPtr;

DurationPredictor::DurationPredictor(
    const std::string &modelSource,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  auto inputTensors = getAllInputShapes();

  // Perform checks to validate model's compatibility with native code
  if (inputTensors.size() == 0) {
    throw std::runtime_error("[Kokoro::DurationPredictor] Model seems to not "
                             "take any input tensors.");
  }
  std::vector<int32_t> modelInputShape = inputTensors[0];
  if (modelInputShape.size() < 4) {
    rnexecutorch::log(
        rnexecutorch::LOG_LEVEL::Error,
        "Unexpected model input size, expected at least 4 dimentions "
        "but got: ",
        modelInputShape.size());
    throw std::runtime_error("[Kokoro::DurationPredictor] Incompatible model");
  }
}

Result<std::vector<EValue>> DurationPredictor::generate(
    const std::string &method, const Configuration &inputConfig,
    std::span<Token> tokens, std::span<int64_t> textMask,
    std::span<float> ref_hs, float speed) {
  // Perform input shape checks
  // Since every bit in text mask corresponds to exactly one of the tokens, both
  // vectors should be the same length
  if (tokens.size() != textMask.size()) {
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Error,
                      "Unexpected text mask length: expected ", tokens.size(),
                      " but got ", textMask.size());
    throw std::runtime_error("[Kokoro::DurationPredictor] Invalid input shape");
  }
  if (ref_hs.size() != constants::kVoiceRefHalfSize) {
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Error,
                      "Unexpected voice ref length: expected ",
                      constants::kVoiceRefHalfSize, " but got ", ref_hs.size());
    throw std::runtime_error("[Kokoro::DurationPredictor] Invalid input shape");
  }

  // Convert input data to ExecuTorch tensors
  auto tokensTensor = make_tensor_ptr({1, static_cast<int32_t>(tokens.size())},
                                      tokens.data(), ScalarType::Long);
  auto textMaskTensor =
      make_tensor_ptr({1, static_cast<int32_t>(textMask.size())},
                      textMask.data(), ScalarType::Long);
  auto voiceRefTensor = make_tensor_ptr({1, constants::kVoiceRefHalfSize},
                                        ref_hs.data(), ScalarType::Float);
  auto speedTensor = make_tensor_ptr({1}, &speed, ScalarType::Float);

  // Execute the appropriate "forward_xyz" method, based on given method name
  auto results = execute(
      method, {tokensTensor, textMaskTensor, voiceRefTensor, speedTensor});

  if (!results.ok()) {
    throw std::runtime_error(
        "[Kokoro::DurationPredictor] Failed to execute method " + method +
        ", error: " + std::to_string(static_cast<uint32_t>(results.error())));
  }

  // Scale output durations to match the value from model's config
  auto predDur = results->at(0).toTensor();
  scaleDurationsUp(predDur, inputConfig.duration);

  // [pred_dur, d]
  return results;
}

void DurationPredictor::scaleDurationsUp(Tensor &durations,
                                         int32_t targetDuration) const {
  // We expect durations tensor to be a Long tensor of a shape [1, n_tokens]
  if (durations.dtype() != ScalarType::Long &&
      durations.dtype() != ScalarType::Int) {
    throw std::runtime_error(
        "[Kokoro::DurationPredictor] Attempted to scale a non-integer tensor");
  }

  auto shape = durations.sizes();
  if (shape.size() != 2) {
    throw std::runtime_error(
        "[Kokoro::DurationPredictor] Attempted to scale an ill-shaped tensor");
  }

  int32_t nTokens = shape[2];
  int64_t *durationsPtr = durations.data_ptr<int64_t>();
  int64_t totalDur = std::accumulate(durationsPtr, durationsPtr + nTokens, 0LL);

  float scaleFactor = static_cast<float>(targetDuration) / totalDur;
  if (scaleFactor < 1.F) {
    throw std::runtime_error(
        "[Kokoro::DurationPredictor] Attempted to shrink a duration tensor");
  }

  // We need to scale partial durations (integers) corresponding to each token
  // in a way that they all sum up to target duration, while keeping the balance
  // between the values.
  std::priority_queue<std::pair<float, int>>
      remainders; // Sorted by the first value
  int64_t scaledSum = 0;
  for (int i = 0; i < nTokens; i++) {
    float scaled = scaleFactor * durationsPtr[i];
    float remainder = std::modf(scaled, nullptr);
    scaledSum += static_cast<int64_t>(scaled) - durationsPtr[i];
    durationsPtr[i] = static_cast<int64_t>(scaled);

    // Keeps the entries sorted by the remainders
    remainders.push({remainder, i});
  }

  // The initial processing scales durations to at least (targetDuration -
  // nTokens) - the next part is to round the remaining values sorted by their
  // remainders size.
  int32_t diff = targetDuration - scaledSum;
  for (int i = 0; i < diff; i++) {
    auto [remainder, idx] = remainders.top();
    durationsPtr[idx] += 1;
    remainders.pop();
  }
}

} // namespace rnexecutorch::models::text_to_speech::kokoro