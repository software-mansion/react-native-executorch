#pragma once

#include <vector>

namespace rnexecutorch::models::speech_to_text::types {

struct GenerationResult {
  std::vector<uint64_t> tokens;
  std::vector<float> scores;
  float noSpeechProb;
};

} // namespace rnexecutorch::models::speech_to_text::types
