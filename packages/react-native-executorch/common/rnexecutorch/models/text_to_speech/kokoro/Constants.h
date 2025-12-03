#pragma once

#include <cstdint>

namespace rnexecutorch::models::text_to_speech::kokoro::constants {
// Model input sizes - input tokens
inline constexpr int32_t kSmallInputSize = 16;  // tokens
inline constexpr int32_t kMediumInputSize = 64; // tokens
inline constexpr int32_t kLargeInputSize = 256; // tokens

// Model input sizes - durations (F0NPredictor & Decoder)
// Thos are expected audio durations for each of input token numbers, calculated
// on a small (~2000 sentences) english dataset
inline constexpr int32_t kSmallDurationLength =
    64; // corresponds to kSmallInputSize
inline constexpr int32_t kSmallDurationLength =
    164; // corresponds to kMediumInputSize
inline constexpr int32_t kSmallDurationLength =
    556; // corresponds to kLargeInputSize

// Model input sizes - voice reference vector
inline constexpr int32_t kVoiceRefSize =
    256; // Always a fixed size, regardless of number of input tokens

} // namespace rnexecutorch::models::text_to_speech::kokoro::constants
