#pragma once

#include <memory>
#include <span>
#include <string>
#include <vector>

#include <executorch/extension/tensor/tensor.h>

#include "Constants.h"
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch::models::text_to_speech::kokoro {

class Decoder : public BaseModel {
public:
  explicit Decoder(const std::string &modelSource,
                   std::shared_ptr<react::CallInvoker> callInvoker);

  /**
   * Runs the decoder to generate audio features from model predictions.
   *
   * @param method      The method name to execute (e.g., "forward_32" for 32
   * input token setup).
   * @param inputConfig The configuration specifying input sizes (number of
   * tokens) and durations.
   * @param asr         Acoustic state representation (obtained from the encoder
   * module).
   * @param f0Pred      F0 (pitch) predictor output (optained fron the F0N
   * predictor module).
   * @param nPred       N (noise) predictor output (optained fron the F0N
   * predictor module).
   * @param ref_ls      Reference speaker embedding (lower segment of the voice
   * vector).
   *
   * @return            A single [audio] vector in PCM (Pulse-Code Modulation)
   * format.
   */
  Result<std::vector<EValue>>
  generate(const std::string &method, const Configuration &inputConfig,
           std::span<float> asr, std::span<float> f0Pred,
           std::span<float> nPred, std::span<float> ref_ls);
};

} // namespace rnexecutorch::models::text_to_speech::kokoro
