#pragma once

#include "Constants.h"

#include <cinttypes>
#include <cstdlib>

/**
 * Hyperparameters
 *
 * Those are adjustable values, which when changed, affect the behavior
 * of the underlying model and/or algorithms.
 */
namespace rnexecutorch::models::speech_to_text::whisper::params {

/**
 * Maximum duration of audio that the streaming buffer keeps before forcing
 * a cleanup. Aligned with Whisper's maximum supported input length.
 */
constexpr inline float kStreamMaxDuration =
    static_cast<float>(constants::kChunkSize);

/**
 * The minimum amount of recent audio always kept in the buffer when a blind
 * cut is performed. Acts as the lower bound on what survives a cleanup.
 */
constexpr inline float kStreamSafetyThreshold = 2.F; // [s]

/**
 * Forced-cleanup threshold. Once the buffer grows past this duration we run
 * the EOS-anchored cleanup routine.
 */
constexpr inline float kStreamSafeBufferDuration =
    kStreamMaxDuration - kStreamSafetyThreshold; // [s]

/**
 * An estimate of the number of words spoken per second.
 * Used for estimating transcription progress and buffer management heuristics.
 */
constexpr inline float kWordsPerSecondEstimation = 2.25F;

/**
 * Upper bound for words per second estimate in fast speech.
 */
constexpr inline float kWordsPerSecondHigh = 4.F;

/**
 * Lower bound for words per second estimate in slow speech.
 */
constexpr inline float kWordsPerSecondLow = 1.5F;

/**
 * Determines the range of buffer left when skipping an audio chunk
 * of size lower than maximum allowed chunk size.
 *
 * If the audio length does not exceed [kChunkSize * kSamplingRate] - [buffer],
 * then instead of moving to the last returned timestamp, we jump across the
 * entire 30 seconds chunk. This resolves the issue of multiple redundant
 * segments being produced by the transcription algorithm.
 */
constexpr inline int32_t kChunkBreakBuffer = 2; // [s]

} // namespace rnexecutorch::models::speech_to_text::whisper::params
