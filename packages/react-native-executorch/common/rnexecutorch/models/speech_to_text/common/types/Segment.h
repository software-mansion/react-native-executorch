#pragma once

#include "Token.h"
#include "Word.h"
#include <cinttypes>
#include <vector>

namespace rnexecutorch::models::speech_to_text {

struct Segment {
  std::vector<Word> words;
  std::vector<Token> tokens; // Raw token IDs
  float start;
  float end;
  float avgLogprob;
  float temperature;
  float compressionRatio;
};

} // namespace rnexecutorch::models::speech_to_text
