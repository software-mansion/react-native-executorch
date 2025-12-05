#pragma once

#include <cstdint>

namespace rnexecutorch::models::text_to_speech::kokoro {
// Type definitions - model (input) configuration
// Since all parts of the Kokoro model are exported with static input shapes,
// it operates on 3 levels of input size - defined by the configuration below.
struct Configuration {
  int32_t noTokens; // Number of input tokens
  int32_t duration; // Expected (maximal) duration (80 ~ 2 seconds of audio)
};

// Type definitions - model input tokens
// TODO: It's possible to switch to int32_t after reexporting models with
// dtype=torch.int
using Token = int64_t;

} // namespace rnexecutorch::models::text_to_speech::kokoro