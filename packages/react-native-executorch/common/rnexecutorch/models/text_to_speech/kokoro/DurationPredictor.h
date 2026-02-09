#pragma once

#include <memory>
#include <span>
#include <string>
#include <tuple>
#include <vector>

#include <executorch/extension/tensor/tensor.h>

#include "Constants.h"
#include "Types.h"
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch::models::text_to_speech::kokoro {

using executorch::aten::Tensor;

class DurationPredictor : public BaseModel {
public:
  explicit DurationPredictor(const std::string &modelSource,
                             const Context &modelContext,
                             std::shared_ptr<react::CallInvoker> callInvoker);

  /**
   * Generates approximated durations and corresponding indices for the input
   * tokens.
   *
   * @param tokens      The input token sequence.
   * @param textMask    A boolean mask indicating which tokens are valid.
   * @param ref_hs      Reference speaker embedding (upper segment of the voice
   * vector).
   * @param speed       Speed factor for synthesis (default: 1.0).
   * @return            Tuple containing:
   *                    d - Tensor: predicted durations for each token,
   *                    indices  - std::vector<int64_t>: repeated token indices,
   *                    effDuration  - int32_t: effective duration after
   *                    post-processing.
   */
  std::tuple<Tensor, std::vector<int64_t>, int32_t>
  generate(std::span<const Token> tokens, std::span<bool> textMask,
           std::span<float> ref_hs, float speed = 1.F);

  // Returns maximum supported amount of input tokens.
  size_t getTokensLimit() const;

private:
  // Helper function - duration scalling
  // Performs integer scaling on the durations tensor to ensure the sum of
  // durations matches the given target duration
  void scaleDurations(Tensor &durations, size_t nTokens,
                      int32_t targetDuration) const;

  // Helper function - calculating effective duration based on duration tensor
  // Since we apply padding to the input, the effective duration is
  // usually a little bit lower than the max duration defined by static input
  // size.
  int32_t calculateEffectiveDuration(const Tensor &d,
                                     const std::vector<int64_t> &indices) const;

  // Available forward methods
  // In order to speed-up the calculations, we allow DurationPredictor to
  // have multiple forward_xyz methods, where syz stands for maximum supported
  // amount of input tokens.
  std::vector<std::pair<std::string, size_t>> forwardMethods_;

  // Shared model context
  // A const reference to singleton in Kokoro.
  const Context &context_;
};

} // namespace rnexecutorch::models::text_to_speech::kokoro
