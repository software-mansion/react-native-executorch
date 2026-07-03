#pragma once

#include <cstddef>
#include <span>

namespace rnexecutorch::models::text_to_speech::supertonic::utils {

/**
 * Strips (near-)silence from the audio edges using a moving-average window.
 * Direct port of the Kokoro cropping algorithm.
 *
 * @param audio  input PCM samples.
 * @param margin number of silence samples to preserve at each retained edge.
 */
std::span<const float> stripAudio(std::span<const float> audio,
                                  size_t margin = 0);

} // namespace rnexecutorch::models::text_to_speech::supertonic::utils
