#pragma once

#include <span>

#include <executorch/extension/tensor/tensor.h>

#include "Constants.h"
#include <rnexecutorch/metaprogramming/ConstructorHelpers.h>
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch {
namespace models::text_to_speech::kokoro {

class Decoder : public BaseModel {
public:
  Decoder(const std::string &modelSource,
          std::shared_ptr<react::CallInvoker> callInvoker);

  Result<std::vector<EValue>>
  generate(const std::string &method, const Configuration &inputConfig,
           std::span<float> asr, std::span<float> f0Pred,
           std::span<float> nPred, std::span<float> ref_ls);
};
} // namespace models::text_to_speech::kokoro

REGISTER_CONSTRUCTOR(models::text_to_speech::kokoro::Decoder, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch