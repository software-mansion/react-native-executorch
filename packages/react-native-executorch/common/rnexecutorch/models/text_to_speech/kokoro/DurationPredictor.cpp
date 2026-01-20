#include "DurationPredictor.h"
#include <algorithm>
#include <cmath>
#include <numeric>
#include <queue>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/data_processing/Sequential.h>
#include <rnexecutorch/metaprogramming/ContainerHelpers.h>

namespace rnexecutorch::models::text_to_speech::kokoro {

using ::executorch::aten::ScalarType;
using ::executorch::extension::make_tensor_ptr;
using ::executorch::extension::TensorPtr;

DurationPredictor::DurationPredictor(
    const std::string &modelSource, const Context &modelContext,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker), context_(modelContext) {
  auto availableMethods = module_->method_names();
  if (!availableMethods.ok()) {
    throw std::runtime_error(
        "[Kokoro::DurationPredictor] Unable to read model's methods");
  }

  // Recognize available forward methods
  const auto &names = *availableMethods;
  for (const auto &name : names) {
    // Check if method starts with "forward"
    if (name.rfind("forward", 0) == 0) {
      const auto inputTensors = getAllInputShapes(name);

      // Perform checks to validate model's compatibility with native code
      CHECK_SIZE(inputTensors, 4);
      CHECK_SIZE(inputTensors[0], 2);

      // Obtain the maximum number of tokens supported by the method
      size_t inputSize = inputTensors[0][1];

      forwardMethods_.push_back({name, inputSize});
    }
  }

  // Sort the forward methods by input size
  std::stable_sort(
      forwardMethods_.begin(), forwardMethods_.end(),
      [](const auto &a, const auto &b) { return a.second < b.second; });
}

std::tuple<Tensor, std::vector<int64_t>, int32_t>
DurationPredictor::generate(std::span<const Token> tokens,
                            std::span<bool> textMask, std::span<float> ref_hs,
                            float speed) {
  size_t inputSize = tokens.size();

  // Perform input shape checks
  // Since every bit in text mask corresponds to exactly one of the tokens, both
  // vectors should be the same length
  CHECK_SIZE(textMask, inputSize);
  CHECK_SIZE(ref_hs, constants::kVoiceRefHalfSize);

  // Select appropriate forward method
  auto it = std::find_if(
      forwardMethods_.begin(), forwardMethods_.end(),
      [inputSize](const auto &entry) { return entry.second >= inputSize; });
  if (it == forwardMethods_.end()) {
    throw std::runtime_error(
        "[Kokoro::DurationPredictor] No appropriate forward method to"
        "handle input of size " +
        std::to_string(inputSize));
  }
  auto selectedMethod = it->first;

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
  auto results = execute(selectedMethod, {tokensTensor, textMaskTensor,
                                          voiceRefTensor, speedTensor});

  if (!results.ok()) {
    throw RnExecutorchError(results.error(),
                            "The model's forward function did not succeed. "
                            "Ensure the model input is correct.");
  }

  // Unpack the result
  auto predDurTensor = results->at(0).toTensor();
  auto predDurPtr = predDurTensor.const_data_ptr<int64_t>();
  auto dTensor = results->at(1).toTensor();

  // Scale output durations if it exceedes the limits
  size_t totalDur = std::reduce(predDurPtr, predDurPtr + inputSize);
  size_t clampedDur = std::clamp(totalDur, constants::kMinDurationTicks,
                                 context_.inputDurationLimit);
  if (totalDur != clampedDur) {
    scaleDurations(predDurTensor, inputSize, clampedDur);
  }

  // Create indices tensor by repetitions according to durations vector
  std::vector<int64_t> idxs(inputSize);
  std::iota(idxs.begin(), idxs.end(), 0LL);
  std::vector<int64_t> indices = rnexecutorch::sequential::repeatInterleave(
      std::span<const int64_t>(idxs),
      std::span<const int64_t>(predDurPtr, inputSize));

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

  /**
   * Returns:
   *   - d: tensor containing the predicted durations for each token.
   *   - indices: vector of repeated token indices according to durations.
   *   - effDuration: an effective duration after post-processing.
   */
  return std::make_tuple(std::move(dTensor), std::move(indices),
                         std::move(effDuration));
}

size_t DurationPredictor::getTokensLimit() const {
  return forwardMethods_.empty() ? 0 : forwardMethods_.back().second;
}

void DurationPredictor::scaleDurations(Tensor &durations, size_t nTokens,
                                       int32_t targetDuration) const {
  // We expect durations tensor to be a Long tensor of a shape [1, n_tokens]
  if (durations.dtype() != ScalarType::Long &&
      durations.dtype() != ScalarType::Int) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidModelOutput,
        "[Kokoro::DurationPredictor] Attempted to scale a non-integer tensor");
  }

  auto shape = durations.sizes();
  if (shape.size() != 1) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidModelOutput,
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