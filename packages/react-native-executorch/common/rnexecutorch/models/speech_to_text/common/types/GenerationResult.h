#pragma once

#include "Token.h"
#include <cinttypes>
#include <vector>

namespace rnexecutorch::models::speech_to_text {

/**
 * An intermediate result of speech-to-text processing, before merging
 * into words.
 *
 * @property tokens Decoded tokens
 * @property scores Probabilities for each corresponding token obtained
 *                  by applying softmax on decoder's output (logits).
 */
struct GenerationResult {
  std::vector<Token> tokens;
  std::vector<float> scores;
};

} // namespace rnexecutorch::models::speech_to_text
