#pragma once

#include <span>

#include <executorch/extension/tensor/tensor.h>

#include "Constants.h"
#include <rnexecutorch/metaprogramming/ConstructorHelpers.h>
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch {
namespace models::text_to_speech::kokoro {

class DurationPredictor : public BaseModel {
public:
  DurationPredictor(const std::string &modelSource,
                    std::shared_ptr<react::CallInvoker> callInvoker);

  Result<std::vector<EValue>> generate(const std::string &method,
                                       std::span<int64_t> tokens,
                                       std::span<int64_t> textMask,
                                       std::span<float> ref_s,
                                       float speed = 1.F);
};
} // namespace models::text_to_speech::kokoro

REGISTER_CONSTRUCTOR(models::text_to_speech::kokoro::DurationPredictor,
                     std::string, std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch