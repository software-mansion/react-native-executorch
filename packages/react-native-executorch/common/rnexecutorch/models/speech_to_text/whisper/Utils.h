#pragma once

#include "../common/types/Word.h"
#include "Constants.h"
#include <algorithm>
#include <cmath>
#include <span>
#include <string>

namespace rnexecutorch::models::speech_to_text::whisper::utils {

/**
 * Checks if the given word represents an End-of-Sentence (EOS) punctuation.
 *
 * @param word The word to check.
 */
constexpr inline bool isEos(const Word &word) {
  return word.content.size() == 1 &&
         constants::kEosPunctations.contains(word.content[0]);
}

} // namespace rnexecutorch::models::speech_to_text::whisper::utils