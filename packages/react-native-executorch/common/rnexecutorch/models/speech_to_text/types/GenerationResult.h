#pragma once

#include <vector>

namespace rnexecutorch::models::speech_to_text::types {

struct GenerationResult {
  std::vector<int32_t> tokens;
  std::vector<float> scores;
};

} // namespace rnexecutorch::models::speech_to_text::types
