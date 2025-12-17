#pragma once

#include "../tagger/tag.h"
#include "types.h"
#include <optional>
#include <string>
#include <unordered_map>

namespace phonemis::phonemizer {

// Lexicon class
// Provides phonemization of extracted tokens.
// Wrapps a dictionary lookup for given word with additional
// pre/post-processing.
class Lexicon {
public:
  Lexicon(Lang language, const std::string &dict_filepath);

  // Checks if given world exists in the lexicon in any form
  bool is_known(const std::string &word) const;

  // Returns the phonemization for given word, or "" if the phonemization failed
  std::u32string get(const std::string &word, const tagger::Tag &tag,
                     std::optional<float> base_stress = std::nullopt,
                     std::optional<bool> vowel_next = std::nullopt);

private:
  // Helper functions - extract phonemes without stressing
  std::u32string get_word(const std::string &word, const tagger::Tag &tag,
                          std::optional<float> stress,
                          std::optional<bool> vowel_next) const;

  // Helper functions - word+suffix phonemization
  // Phonemizes word ending with popular english suffixes, example: -ed, -s,
  // -ing.
  std::u32string stem_s(const std::string &word, const tagger::Tag &tag,
                        std::optional<float> stress) const;
  std::u32string stem_ed(const std::string &word, const tagger::Tag &tag,
                         std::optional<float> stress) const;
  std::u32string stem_ing(const std::string &word, const tagger::Tag &tag,
                          std::optional<float> stress) const;

  // Helper functions - dictionary lookup with stressing
  // Returns an empty phoneme string if failed to extract phonemes.
  std::u32string lookup(const std::string &word, const tagger::Tag &tag,
                        std::optional<float> stress) const;
  std::u32string lookup_nnp(const std::string &word) const;
  std::u32string lookup_special(const std::string &word, const tagger::Tag &tag,
                                std::optional<float> stress,
                                std::optional<bool> vowel_next) const;

  // Resolved language
  Lang language_;

  // Lookup dictionary: text -> phonemes
  // Provide quick and direct phonemization for popular words.
  std::unordered_map<std::string, std::u32string> dict_ = {};
};

} // namespace phonemis::phonemizer