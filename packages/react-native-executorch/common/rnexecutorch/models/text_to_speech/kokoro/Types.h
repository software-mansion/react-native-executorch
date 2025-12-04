#pragma once

#include <cstdint>

namespace rnexecutorch::models::text_to_speech::kokoro {
struct Configuration {
  int32_t noTokens; // Number of input tokens
  int32_t duration; // Expected (maximal) duration (80 ~ 2 seconds of audio)
};

} // namespace rnexecutorch::models::text_to_speech::kokoro