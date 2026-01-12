#pragma once

#include <memory>
#include <span>
#include <string>
#include <vector>

#include <executorch/extension/tensor/tensor.h>

#include "Constants.h"
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch::models::text_to_speech::kokoro {

class F0NPredictor : public BaseModel {
public:
  explicit F0NPredictor(const std::string &modelSource,
                        std::shared_ptr<react::CallInvoker> callInvoker);

  Result<std::vector<EValue>> generate(const std::string &method,
                                       const Configuration &inputConfig,
                                       std::span<int64_t> indices,
                                       std::span<float> dur,
                                       std::span<float> ref_hs);
};

} // namespace rnexecutorch::models::text_to_speech::kokoro
