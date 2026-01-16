#pragma once

#include "constants.h"
#include <vector>

namespace phonemis::preprocessor {

// Normalizes the text by replacing all foreign characters
// to latin-only phrases.
std::string normalize_unicode(const std::string &text);

// Divides a monolit text into multiple sentences.
// A sentence always ends with a end of sentence character (defined in
// constants.h).
std::vector<std::string> split_sentences(const std::string &text);

// Converts all the numbers in the text to spoken representations.
// Usually expands the size of the text.
std::string verbalize_numbers(const std::string &text);

} // namespace phonemis::preprocessor