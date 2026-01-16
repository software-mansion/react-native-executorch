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

  /**
   * Runs the F0N predictor to generate pitch and noise features.
   *
   * @param method      The method name to execute (e.g., "forward_32" for 32
   * input token setup).
   * @param inputConfig The configuration specifying input sizes (number of
   * tokens) and durations.
   * @param indices     Repeated token indices according to durations.
   * @param dur         Predicted durations for each token.
   * @param ref_hs      Reference speaker embedding (upper segment of the voice
   * vector).
   * @return            F0 prediction, N prediction, and related features
   */
  Result<std::vector<EValue>> generate(const std::string &method,
                                       const Configuration &inputConfig,
                                       std::span<int64_t> indices,
                                       std::span<float> dur,
                                       std::span<float> ref_hs);
};

} // namespace rnexecutorch::models::text_to_speech::kokoro
