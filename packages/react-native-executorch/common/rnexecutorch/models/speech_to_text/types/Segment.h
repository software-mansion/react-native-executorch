#pragma once

#include "Word.h"
#include <vector>

namespace rnexecutorch::models::speech_to_text::types {

struct Segment {
  std::vector<Word> words;
  std::vector<uint64_t> tokens; // Raw token IDs
  float start;
  float end;
  float avgLogprob;
  float temperature;
  float compressionRatio;
};

} // namespace rnexecutorch::models::speech_to_text::types
