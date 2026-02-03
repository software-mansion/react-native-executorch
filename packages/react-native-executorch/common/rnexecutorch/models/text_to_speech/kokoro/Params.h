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
 * A set of punctation - pause values. Determines how much pause (silence) is
 * being added at the end of each calculated audio vector. This is primarly used
 * when the input text is partitioned for subsentences, to make the pause
 * between subsentences feel natural. Pause values are measured in miliseconds
 * (ms).
 */
inline const std::unordered_map<char32_t, int32_t> kPauseValues = {
    {U'.', 250}, {U'?', 350}, {U'!', 180}, {U';', 300},
    {U'…', 500}, {U',', 125}, {U':', 175}, {U'-', 175}}; // [ms]

/**
 * A default pause applied after a sentence finished with a character other
 * than the ones defined in kPauseValues.
 */
inline constexpr int32_t kDefaultPause = 0; // [ms]

// Audio cropping related hyperparameters
namespace cropping {
/**
 * The audio cropping algorithm is a moving average variant.
 * This value controls the number of steps in moving average.
 */
inline constexpr uint32_t kAudioCroppingSteps = 20;

/**
 * Determines silent audio fragments in audio cropping algorithm.
 * The audio fragment is considered as a silence, if the moving average with K
 * steps does not exceed this threshold.
 */
inline constexpr float kAudioSilenceThreshold = 0.01F;
} // namespace cropping

// Partitioning related hyperparameters
namespace partitioning {
/**
 * A penalty for dividing text on end of sentence character (like . or !).
 */
inline constexpr int64_t kEosPenalty = 5;

/**
 * A penalty for dividing text on pause character (like , or -).
 */
inline constexpr int64_t kPausePenalty = 18;

/**
 * A penalty for dividing text in the middle of sentence -
 * in other words, on white character.
 *
 * We want to avoid splitting the text between two words with no pause
 * as much as possible, since it kills the naturalness of the speech.
 */
inline constexpr int64_t kWhitePenalty = 1000;

/**
 * Used in latency-focused partitioning variant. Decides on
 * how much more are big latencies in the beginning phase of
 * an input text penalized.
 */
inline constexpr int32_t kTokenDiscountFactor = 1;

/**
 * Used in latency-focused partitioning variant. Decides on
 * how quickly latency penalties (linearly interpolated) evaporate
 * with each processed token.
 * For example, using kTokenDiscountRange = 128 means that after reaching
 * 128 tokens, the latency is completely omited and not penalized.
 */
inline constexpr int32_t kTokenDiscountRange = 128;
} // namespace partitioning

} // namespace rnexecutorch::models::text_to_speech::kokoro::params