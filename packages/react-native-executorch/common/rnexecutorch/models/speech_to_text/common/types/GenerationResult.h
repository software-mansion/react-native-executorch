#pragma once

#include "Token.h"
#include <cinttypes>
#include <vector>

namespace rnexecutorch::models::speech_to_text {

struct GenerationResult {
  std::vector<Token> tokens;
  std::vector<float> scores;
};

} // namespace rnexecutorch::models::speech_to_text
