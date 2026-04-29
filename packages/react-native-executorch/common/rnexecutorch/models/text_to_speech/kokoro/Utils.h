#pragma once

#include "Types.h"
#include <optional>
#include <span>
#include <string>
#include <vector>

namespace rnexecutorch::models::text_to_speech::kokoro::utils {

/**
 * Strips silence from audio edges using a sliding window.
 * @param audio The input audio samples.
 * @param margin Number of silence samples to preserve at each edge.
 */
std::span<const float> stripAudio(std::span<const float> audio,
                                  size_t margin = 0);

/**
 * Maps phonemes to vocabulary tokens with start/end padding.
 * @param phonemes UTF-32 phoneme sequence.
 * @param expectedSize If set, pads the output to this exact length.
 */
std::vector<Token> tokenize(std::u32string_view phonemes,
                            std::optional<size_t> expectedSize = std::nullopt);

} // namespace rnexecutorch::models::text_to_speech::kokoro::utils