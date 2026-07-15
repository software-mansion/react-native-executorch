#pragma once

#include <cstdint>
#include <unordered_map>

/**
 * Hyperparameters
 *
 * Those are adjustable values, which when changed, affect the behavior
 * of the underlying models and/or algorithms.
 */
namespace rnexecutorch::models::text_to_speech::kokoro::params {

/**
 * Causes an exception to be thrown on input texts longer
 * (in terms of number of characters) than this value.
 *
 * Note that the partitioning algorithm theoreticaly allows for
 * any input length to be processed, so using this parameter is optional.
 */
inline constexpr size_t kMaxTextSize = 2048;

/**
 * A size of pause (in miliseconds) applied after each streaming iteration.
 */
inline constexpr int32_t kStreamPause = 200;

/**
 * A set of punctation - pause values. Determines how much pause (silence) is
 * being added at the end of each calculated audio vector. This is primarly used
 * when the input text is partitioned for subsentences, to make the pause
 * between subsentences feel natural. Pause values are measured in miliseconds
 * (ms).
 */
inline const std::unordered_map<char32_t, int32_t> kPauseValues = {
    {U'.', 375},
    {U'?', 500},
    {U'!', 250},
    {U';', 400},
    {U'…', 600}, // Ellipsis
    {U',', 130},
    {U':', 250},
    {U'-', 200},
    {U'—', 250}, // Em Dash (slightly
                 // longer than hyphen)
    {U'|', 375}, // ASCII Pipe (treated as full stop)
    {U'।', 375}, // Hindi Purna Viram
    {U'॥', 500}, // Hindi Deergh Viram (typically longer than Purna Viram)
    {U'¿', 50},  // Spanish Inverted Question Mark (short preparatory pause)
    {U'¡', 50},  // Spanish Inverted Exclamation Mark (short preparatory pause)
    {U'«', 50},  // Guillemet open (short pause)
    {U'»', 100}, // Guillemet close (short pause)
}; // [ms]

/**
 * A default pause applied after a sentence finished with a character other
 * than the ones defined in kPauseValues.
 */
inline constexpr int32_t kDefaultPause = 0; // [ms]

// Audio cropping related hyperparameters
namespace cropping {
inline constexpr uint32_t kAudioCroppingSteps = 10;
inline constexpr float kAudioSilenceThreshold = 0.005F;
} // namespace cropping

// Partitioning related hyperparameters
namespace partitioning {
inline constexpr int64_t kTokenDiscountFactor = 1;
inline constexpr int64_t kTokenDiscountRange = 128;

inline constexpr uint64_t kEosCost = 5;
inline constexpr uint64_t kPauseCost = 18;
inline constexpr uint64_t kWhiteCost = 1000;

} // namespace partitioning

} // namespace rnexecutorch::models::text_to_speech::kokoro::params