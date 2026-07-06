#pragma once

#include <cstdint>
#include <unordered_set>

namespace rnexecutorch::models::text_to_speech::constants {

// Special text characters - end of sentence markers
inline const std::unordered_set<char32_t> kEndOfSentenceCharacters = {
    U'.', U'?', U'!', U';',
    U'…', // Ellipsis
    U'|', // ASCII Pipe (often used as Hindi Purna Viram)
    U'।', // Hindi Purna Viram (U+0964)
    U'॥', // Hindi Deergh Viram (U+0965)
    U'¿', // Spanish Inverted Question Mark (U+00BF)
    U'¡', // Spanish Inverted Exclamation Mark (U+00A1)
};

// Special text characters - mid-sentence pause markers
inline const std::unordered_set<char32_t> kPauseCharacters = {
    U',', U':', U'-',
    U'—', // Em Dash (U+2014)
    U'«', // Left Guillemet (U+00AB)
    U'»', // Right Guillemet (U+00BB)
};

} // namespace rnexecutorch::models::text_to_speech::constants