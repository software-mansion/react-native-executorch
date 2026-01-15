#include "DurationPredictor.h"
#include <algorithm>
#include <cmath>
#include <numeric>
#include <queue>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/Sequential.h>
#include <rnexecutorch/metaprogramming/ContainerHelpers.h>

namespace rnexecutorch::models::text_to_speech::kokoro {

using ::executorch::aten::ScalarType;
using ::executorch::extension::make_tensor_ptr;
using ::executorch::extension::TensorPtr;

DurationPredictor::DurationPredictor(
    const std::string &modelSource,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  const std::string testMethod =
      "forward_" + std::to_string(constants::kInputSmall.noTokens);
  const auto inputTensors = getAllInputShapes(testMethod);

  // Perform checks to validate model's compatibility with native code
  CHECK_SIZE(inputTensors, 4);
}

std::tuple<Tensor, std::vector<int64_t>, int32_t> DurationPredictor::generate(
    const std::string &method, const Configuration &inputConfig,
    std::span<const Token> tokens, std::span<bool> textMask,
    std::span<float> ref_hs, float speed) {
  // Perform input shape checks
  // Since every bit in text mask corresponds to exactly one of the tokens, both
  // vectors should be the same length
  CHECK_SIZE(tokens, textMask.size());
  CHECK_SIZE(ref_hs, constants::kVoiceRefHalfSize);

  // Convert input data to ExecuTorch tensors
  auto tokensTensor =
      make_tensor_ptr({1, static_cast<int32_t>(tokens.size())},
                      const_cast<Token *>(tokens.data()), ScalarType::Long);
  auto textMaskTensor =
      make_tensor_ptr({1, static_cast<int32_t>(textMask.size())},
                      textMask.data(), ScalarType::Bool);
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

  // Unpack the result
  auto predDur = results->at(0).toTensor();
  auto d = results->at(1).toTensor();

  // Scale output durations to match the value from model's config
  scaleDurations(predDur, inputConfig.duration);

  // Create indices tensor by repetitions according to durations vector
  std::vector<int64_t> idxs(inputConfig.noTokens);
  std::iota(idxs.begin(), idxs.end(), 0LL);
  std::vector<int64_t> indices = rnexecutorch::sequential::repeatInterleave(
      std::span<const int64_t>(idxs),
      std::span<const int64_t>(predDur.const_data_ptr<int64_t>(),
                               predDur.numel()));

  // Calculate the effective duration
  // Note that we lower effective duration even further, to remove
  // some of the side-effects at the end of the audio.
  int32_t originalLength =
      std::distance(tokens.begin(),
                    std::find(tokens.begin() + 1, tokens.end(), 0)) +
      1;
  int32_t effDuration = std::distance(
      indices.begin(),
      std::lower_bound(indices.begin(), indices.end(), originalLength));

  // It's not necessary, but we observed a positive effect in removing
  // anomalies (due to the extended padding of the input vector) in
  // the resulting audio vector.
  if (effDuration < inputConfig.duration)
    effDuration *= 0.95;

  /**
   * Returns:
   *   - d: tensor containing the predicted durations for each token.
   *   - indices: vector of repeated token indices according to durations.
   *   - effDuration: an effective duration after post-processing.
   */
  return std::make_tuple(std::move(d), std::move(indices),
                         std::move(effDuration));
}

void DurationPredictor::scaleDurations(Tensor &durations,
                                       int32_t targetDuration) const {
  // We expect durations tensor to be a Long tensor of a shape [1, n_tokens]
  if (durations.dtype() != ScalarType::Long &&
      durations.dtype() != ScalarType::Int) {
    throw std::runtime_error(
        "[Kokoro::DurationPredictor] Attempted to scale a non-integer tensor");
  }

  auto shape = durations.sizes();
  if (shape.size() != 1) {
    throw std::runtime_error(
        "[Kokoro::DurationPredictor] Attempted to scale an ill-shaped tensor");
  }

  int32_t nTokens = shape[0];
  int64_t *durationsPtr = durations.mutable_data_ptr<int64_t>();
  int64_t totalDur = std::reduce(durationsPtr, durationsPtr + nTokens);

  float scaleFactor = static_cast<float>(targetDuration) / totalDur;
  bool shrinking = scaleFactor < 1.F;

  // We need to scale partial durations (integers) corresponding to each token
  // in a way that they all sum up to target duration, while keeping the balance
  // between the values.
  std::priority_queue<std::pair<float, uint32_t>>
      remainders; // Sorted by the first value
  int64_t scaledSum = 0;
  for (uint32_t i = 0; i < nTokens; i++) {
    float scaled = scaleFactor * durationsPtr[i];
    float remainder =
        shrinking ? std::ceil(scaled) - scaled : scaled - std::floor(scaled);

    durationsPtr[i] = static_cast<int64_t>(shrinking ? std::ceil(scaled)
                                                     : std::floor(scaled));
    scaledSum += durationsPtr[i];

    // Keeps the entries sorted by the remainders
    remainders.emplace(remainder, i);
  }

  // The initial processing scales durations to at least (targetDuration -
  // nTokens) - the next part is to round the remaining values sorted by their
  // remainders size.
  int32_t diff = std::abs(targetDuration - scaledSum);
  for (uint32_t i = 0; i < diff; i++) {
    auto [remainder, idx] = remainders.top();
    durationsPtr[idx] += shrinking ? -1 : 1;
    remainders.pop();
  }
}

} // namespace rnexecutorch::models::text_to_speech::kokoro