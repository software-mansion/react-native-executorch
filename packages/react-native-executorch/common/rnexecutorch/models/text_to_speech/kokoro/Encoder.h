#pragma once

#include <memory>
#include <span>
#include <string>
#include <vector>

#include <executorch/extension/tensor/tensor.h>

#include "Constants.h"
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch::models::text_to_speech::kokoro {

class Encoder : public BaseModel {
public:
  explicit Encoder(const std::string &modelSource,
                   std::shared_ptr<react::CallInvoker> callInvoker);

  Result<std::vector<EValue>> generate(const std::string &method,
                                       const Configuration &inputConfig,
                                       std::span<Token> tokens,
                                       std::span<bool> textMask,
                                       std::span<float> pred_aln_trg);
};

} // namespace rnexecutorch::models::text_to_speech::kokoro
