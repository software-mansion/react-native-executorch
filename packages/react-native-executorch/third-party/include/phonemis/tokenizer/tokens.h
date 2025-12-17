#pragma once

#include "../tagger/tag.h"
#include <optional>
#include <string>

namespace phonemis::tokenizer {

// A main structure representing a single token extracted from text
// Mandatory fields are extracted during the tokenization stage, while
// extra fields might be processed later (for example, during the tagging stage)
struct Token {
  std::string text;
  std::string whitespace = ""; // Following whitespace
  bool is_first = false;       // Whether it is a first token in the sentence

  // Extras
  std::optional<tagger::Tag> tag =
      std::nullopt; // A PoS (Part of Speech) tag, example: NN (noun)
};

} // namespace phonemis::tokenizer