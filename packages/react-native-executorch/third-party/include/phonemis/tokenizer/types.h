#pragma once

#include <string>

namespace phonemis::tokenizer {

namespace rules {
// Separation rules for special characters
enum class Separation {
  JOIN_LEFT,    // Join to the word on its left
  JOIN_RIGHT,   // Join to the word on its right
  TOTAL_DIVIDE, // Always separate from both sides
  TOTAL_JOIN    // Always join both sides
};
} // namespace rules

struct SpecialCharacter {
  char character;
  rules::Separation sep_rule;
};

} // namespace phonemis::tokenizer