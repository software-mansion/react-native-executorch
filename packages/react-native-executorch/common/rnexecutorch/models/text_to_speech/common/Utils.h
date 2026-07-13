#pragma once

#include <cstdint>
#include <span>

namespace rnexecutorch::models::text_to_speech::utils {

/**
 * Strips silence from audio edges using a sliding-window moving average.
 * @param audio The input audio samples.
 * @param margin Number of silence samples to preserve at each edge.
 * @param croppingSteps Number of steps in the moving average window.
 * @param silenceThreshold Amplitude threshold below which audio is considered
 * silence.
 */
std::span<const float> stripAudio(std::span<const float> audio,
                                  size_t margin = 0,
                                  uint32_t croppingSteps = 10,
                                  float silenceThreshold = 0.005F);

} // namespace rnexecutorch::models::text_to_speech::utils
