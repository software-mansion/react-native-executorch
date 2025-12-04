#pragma once

#include <span>

#include <executorch/extension/tensor/tensor.h>

#include "Constants.h"
#include <rnexecutorch/metaprogramming/ConstructorHelpers.h>
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch {
namespace models::text_to_speech::kokoro {

using executorch::aten::Tensor;

class DurationPredictor : public BaseModel {
public:
  DurationPredictor(const std::string &modelSource,
                    std::shared_ptr<react::CallInvoker> callInvoker);

  Result<std::vector<EValue>>
  generate(const std::string &method, const Configuration &inputConfig,
           std::span<int64_t> tokens, std::span<int64_t> textMask,
           std::span<float> ref_hs, float speed = 1.F);

private:
  // Helper functions - duration scalling
  // Performs integer scaling on the durations tensor to ensure the sum of
  // durations matches the given target duration
  void scaleDurationsUp(Tensor &durations, int32_t targetDuration) const;
};
} // namespace models::text_to_speech::kokoro

REGISTER_CONSTRUCTOR(models::text_to_speech::kokoro::DurationPredictor,
                     std::string, std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch