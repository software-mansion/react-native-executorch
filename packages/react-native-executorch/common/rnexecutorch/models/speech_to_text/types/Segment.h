#pragma once

#include <vector>
#include "Word.h"

namespace rnexecutorch::models::speech_to_text::types {

struct Segment {
  std::vector<Word> words;
  std::vector<int32_t> tokens; // Raw token IDs
  float start;
  float end;
  float avgLogprob;
  float noSpeechProbability;
  float temperature;
  float compressionRatio;
};

} // namespace rnexecutorch::models::speech_to_text::types
