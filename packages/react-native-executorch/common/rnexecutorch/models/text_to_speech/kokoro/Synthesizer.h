#pragma once

#include <memory>
#include <span>
#include <string>
#include <vector>

#include <executorch/extension/tensor/tensor.h>

#include "Constants.h"
#include "Types.h"
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch::models::text_to_speech::kokoro {

/**
 * A module for synthesizing audio from scratch.
 *
 * As it stands for now, this module is designed to utilize only
 * dynamic input shape versions of exported Kokoro model.
 */
class Synthesizer : public BaseModel {
public:
  explicit Synthesizer(const std::string &modelSource,
                       const Context &modelContext,
                       std::shared_ptr<react::CallInvoker> callInvoker);

  /**
   * Generates an audio vector in PCM (Pulse-Code Modulation) format for
   * given input tokens and voice. Requires additional duration data obtained
   * from DurarionPredictor.
   *
   * @param tokens tokenized input text (see utils::tokenize())
   * @param textMask a boolean mask, marking real input with 1 and padded values
   * with 0
   * @param indices token indices array with shape (1 x d),
   *                where d corresponds to calculated duration, obtained from
   * DurationPredictor module
   * @param dur duration values, obtained from DurationPredictor module
   * @param ref_s a full voice array for given duration
   */
  Result<std::vector<EValue>> generate(std::span<const Token> tokens,
                                       std::span<bool> textMask,
                                       std::span<int64_t> indices,
                                       std::span<float> dur,
                                       std::span<float> ref_s);

  // Model limits getters
  size_t getTokensLimit() const;
  size_t getDurationLimit() const;

private:
  // Shared model context
  // A const reference to singleton in Kokoro.
  const Context &context_;
};

} // namespace rnexecutorch::models::text_to_speech::kokoro
