#pragma once

#include <memory>
#include <span>
#include <string>

#include <rnexecutorch/models/BaseModel.h>

#include "Types.h"

namespace rnexecutorch::models::text_to_speech::supertonic {

/**
 * Wraps the duration_predictor submodule.
 *
 * Receives token ids, an attention mask, and the duration-predictor
 * style vector; returns the predicted utterance length in seconds.
 */
class DurationPredictor : public BaseModel {
public:
  explicit DurationPredictor(const std::string &modelSource,
                             std::shared_ptr<react::CallInvoker> callInvoker);

  /**
   * Predicts the duration of the utterance in seconds.
   *
   * @param ids      Token ids for the input, shape [tLen].
   * @param mask     Float attention mask, shape [tLen], 1.0 for valid tokens.
   * @param styleDp  Duration-predictor style vector, flat (kStyleDpSize).
   * @param speed    Playback speed multiplier (duration is divided by speed).
   * @return         Predicted duration in seconds.
   */
  float generate(std::span<Token> ids, std::span<float> mask,
                 std::span<float> styleDp, float speed) const;
};

} // namespace rnexecutorch::models::text_to_speech::supertonic
