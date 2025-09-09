#pragma once

#include <vector>

#include "Word.h"

namespace rnexecutorch::models::speech_to_text::types {

struct Segment {
  std::vector<Word> words;
  float noSpeechProbability;
};

} // namespace rnexecutorch::models::speech_to_text::types
