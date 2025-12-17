#pragma once

#include "lexicon.h"
#include <memory>

namespace phonemis::phonemizer {

// Phonemizer class
// Combines lexicon lookup-style phonemization with rule-based fallback
class Phonemizer {
public:
  Phonemizer(Lang language, const std::string &lexicon_filepath = "");

  // Main phonemization method
  std::u32string phonemize(const std::string &word, const tagger::Tag &tag,
                           std::optional<float> base_stress = std::nullopt,
                           std::optional<bool> vowel_next = std::nullopt) const;

private:
  // Helper functions - rule-based fallback methods
  std::u32string fallback(const std::string &word,
                          const tagger::Tag &tag) const;

  // Lexicon component
  std::unique_ptr<Lexicon> lexicon_ = nullptr;
};

} // namespace phonemis::phonemizer