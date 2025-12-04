#pragma once

#include <cstdint>

#include "Types.h"

namespace rnexecutorch::models::text_to_speech::kokoro::constants {
// Model input sizes - input tokens & max (expected) durations
inline constexpr Configuration kSmallInput = {.noTokens = 16, .duration = 64};
inline constexpr Configuration kMediumInput = {.noTokens = 64, .duration = 164};
inline constexpr Configuration kLargeInput = {.noTokens = 256, .duration = 556};

// Model input sizes - voice reference vector
inline constexpr int32_t kVoiceRefSize =
    256; // Always a fixed size, regardless of number of input tokens
inline constexpr int32_t kVoiceRefHalfSize = kVoiceRefSize / 2;

} // namespace rnexecutorch::models::text_to_speech::kokoro::constants
