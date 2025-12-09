#pragma once

#include <span>

#include <executorch/extension/tensor/tensor.h>

#include "Constants.h"
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch {
namespace models::text_to_speech::kokoro {

class Encoder : public BaseModel {
public:
  Encoder(const std::string &modelSource,
          std::shared_ptr<react::CallInvoker> callInvoker);

  Result<std::vector<EValue>> generate(const std::string &method,
                                       const Configuration &inputConfig,
                                       std::span<Token> tokens,
                                       std::span<bool> textMask,
                                       std::span<float> pred_aln_trg);
};
} // namespace models::text_to_speech::kokoro
} // namespace rnexecutorch