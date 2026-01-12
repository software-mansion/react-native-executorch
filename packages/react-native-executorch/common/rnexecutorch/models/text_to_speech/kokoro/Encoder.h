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

  /**
   * Runs the encoder to generate acoustic state representations from input
   * tokens.
   *
   * @param method        The method name to execute (e.g., "forward_32" for 32
   * input token setup).
   * @param inputConfig   The configuration specifying input sizes (number of
   * tokens) and durations.
   * @param tokens        The input token sequence.
   * @param textMask      Mask indicating which tokens are valid.
   * @param pred_aln_trg  Predicted alignment target tensor.
   * @return              A single tensor with ASR (Acoustic State
   * Representation) features.
   */
  Result<std::vector<EValue>> generate(const std::string &method,
                                       const Configuration &inputConfig,
                                       std::span<const Token> tokens,
                                       std::span<bool> textMask,
                                       std::span<float> pred_aln_trg);
};

} // namespace rnexecutorch::models::text_to_speech::kokoro
