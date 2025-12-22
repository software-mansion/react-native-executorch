#pragma once

#include "Types.h"
#include <optional>
#include <span>
#include <string>
#include <vector>

namespace rnexecutorch::models::text_to_speech::kokoro::utils {

// Removes silence from the beginning and the end of an audio (with some
// margin).
// Returns a [l - m, r + m] range of audio samples, where m is the margin,
// l and r correspond to lower and upper audio bound respectively.
std::span<const float> stripAudio(std::span<const float> audio,
                                  size_t margin = 0);

// Tokenizes given phoneme string.
// Each phoneme corresponds to exactly one token, with 2 additional pad
// tokens added at both ends.
// If extecped number of tokens provided, eventually expands the token vector
// with pad tokens to match given length.
std::vector<Token> tokenize(const std::u32string &phonemes,
                            std::optional<size_t> expectedSize = std::nullopt);

} // namespace rnexecutorch::models::text_to_speech::kokoro::utils