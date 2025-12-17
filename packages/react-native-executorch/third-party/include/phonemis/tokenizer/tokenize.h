#pragma once

#include "tokens.h"
#include "types.h"
#include <string>
#include <vector>

namespace phonemis::tokenizer {

// Tokenizes the input text into a vector of strings (tokens).
// Follows specific rules for special characters and special words.
std::vector<Token> tokenize(const std::string &text);

} // namespace phonemis::tokenizer
