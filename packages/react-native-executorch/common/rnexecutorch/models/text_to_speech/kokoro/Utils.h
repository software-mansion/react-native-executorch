#pragma once

#include "Types.h"
#include <optional>
#include <span>
#include <string>
#include <vector>

namespace rnexecutorch::models::text_to_speech::kokoro::utils {

/**
 * Maps phonemes to vocabulary tokens with start/end padding.
 * @param phonemes UTF-32 phoneme sequence.
 * @param expectedSize If set, pads the output to this exact length.
 */
std::vector<Token> tokenize(std::u32string_view phonemes,
                            std::optional<size_t> expectedSize = std::nullopt);

} // namespace rnexecutorch::models::text_to_speech::kokoro::utils