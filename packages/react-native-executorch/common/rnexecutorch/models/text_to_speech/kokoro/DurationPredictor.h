#pragma once

#include <span>
#include <tuple>

#include <executorch/extension/tensor/tensor.h>

#include "Constants.h"
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch::models::text_to_speech::kokoro {

using executorch::aten::Tensor;

class DurationPredictor : public BaseModel {
public:
  DurationPredictor(const std::string &modelSource,
                    std::shared_ptr<react::CallInvoker> callInvoker);

  // Returns a tuple (d, indices, effectiveDuration)
  std::tuple<Tensor, std::vector<int64_t>, int32_t>
  generate(const std::string &method, const Configuration &inputConfig,
           std::span<Token> tokens, std::span<bool> textMask,
           std::span<float> ref_hs, float speed = 1.F);

private:
  // Helper function - duration scalling
  // Performs integer scaling on the durations tensor to ensure the sum of
  // durations matches the given target duration
  void scaleDurations(Tensor &durations, int32_t targetDuration) const;

  // Helper function - calculating effective duration based on duration tensor
  // Since we apply padding to the input, the effective duration is
  // usually a little bit lower than the max duration defined by static input
  // size.
  int32_t calculateEffectiveDuration(const Tensor &d,
                                     const std::vector<int64_t> &indices) const;
};

} // namespace rnexecutorch::models::text_to_speech::kokoro
