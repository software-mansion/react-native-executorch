#pragma once

#include <cinttypes>

/**
 * Hyperparameters
 *
 * Those are adjustable values, which when changed, affect the behavior
 * of the underlying model and/or algorithms.
 */
namespace rnexecutorch::models::speech_to_text::whisper::params {

/**
 * Determines the range of buffer left when skipping an audio chunk
 * of size lower than maximum allowed chunk size.
 *
 * If the audio length does not exceed [kChunkSize * kSamplingRate] - [buffer],
 * then instead of moving to the last returned timestamp, we jump across the
 * entire 30 seconds chunk. This resolves the issue of multiple redundant
 * segments being produced by the transcription algorithm.
 */
constexpr static int32_t kChunkBreakBuffer = 2; // [s]

/**
 * Determines the maximum timestamp difference available for a word to be
 * considered as fresh in streaming algorithm.
 */
constexpr static float kStreamFreshThreshold = 1.F; // [s], originally 0.5

/**
 * Determines the maximum expected size of overlapping fragments between
 * fresh words buffer and commited words buffer in streaming mode.
 *
 * It is a limit of maximum amount of erased repeated words from fresh buffer.
 * The bigger it gets, the less probable it is to commit the same phrase twice.
 */
constexpr static size_t kStreamMaxOverlapSize =
    10; // Number of overlaping words

/**
 * Similar to kMaxStreamOverlapSize, but this one determines
 * the maximum allowed timestamp difference between the overlaping fragments.
 */
constexpr static float kStreamMaxOverlapTimestampDiff = 5.F; // [s]

} // namespace rnexecutorch::models::speech_to_text::whisper::params