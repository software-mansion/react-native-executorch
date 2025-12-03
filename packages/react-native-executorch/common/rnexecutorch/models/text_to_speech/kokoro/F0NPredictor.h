#pragma once

#include <span>

#include <executorch/extension/tensor/tensor.h>

#include "Constants.h"
#include <rnexecutorch/metaprogramming/ConstructorHelpers.h>
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch {
namespace models::text_to_speech::kokoro {

class F0NPredictor : public BaseModel {
public:
  F0NPredictor(const std::string &modelSource,
               std::shared_ptr<react::CallInvoker> callInvoker);

  Result<std::vector<EValue>> generate(const std::string &method,
                                       int32_t duration, std::span<float> en,
                                       std::span<float> s);
};
} // namespace models::text_to_speech::kokoro

REGISTER_CONSTRUCTOR(models::text_to_speech::kokoro::F0NPredictor, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch