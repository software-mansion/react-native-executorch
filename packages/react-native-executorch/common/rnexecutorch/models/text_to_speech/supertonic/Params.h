#pragma once

#include <cstdint>
#include <unordered_map>

/**
 * Tunable hyperparameters for the Supertonic pipeline. Mirrors the structure of
 * the Kokoro params so the streaming/partitioning behaviour is familiar.
 */
namespace rnexecutorch::models::text_to_speech::supertonic::params {

// Hard cap on a single synthesis input (characters). The partitioner can
// handle any length, so this is a safety valve only.
inline constexpr size_t kMaxTextSize = 2048;

// Max characters per synthesized segment.
inline constexpr size_t kMaxSegmentChars = 256;

inline constexpr float kDefaultSpeedF = 1.05F;
inline constexpr int32_t kDefaultStepsI = 8;

// Pause inserted between streaming iterations to avoid busy-spinning.
inline constexpr int32_t kStreamPause = 200; // [ms]

// Silence appended after a segment based on its terminating punctuation.
inline const std::unordered_map<char32_t, int32_t> kPauseValues = {
    {U'.', 300}, {U'?', 400}, {U'!', 300}, {U';', 300}, {U'…', 500},
    {U',', 120}, {U':', 200}, {U'-', 150}, {U'—', 200},
}; // [ms]

// Default inter-segment silence (mirrors DEFAULT_SILENCE_DURATION = 0.3 s).
inline constexpr int32_t kDefaultPause = 300; // [ms]

// Audio cropping (trailing-silence trim) hyperparameters.
namespace cropping {
inline constexpr uint32_t kAudioCroppingSteps = 16;
inline constexpr float kAudioSilenceThreshold = 0.0005F;
} // namespace cropping

// Partitioning cost weights (identical scheme to Kokoro).
namespace partitioning {
inline constexpr int64_t kTokenDiscountFactor = 1;
inline constexpr int64_t kTokenDiscountRange = 128;

inline constexpr uint64_t kEosCost = 5;
inline constexpr uint64_t kPauseCost = 18;
inline constexpr uint64_t kWhiteCost = 1000;
} // namespace partitioning

} // namespace rnexecutorch::models::text_to_speech::supertonic::params
