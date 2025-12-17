#pragma once

#include <string>
#include <unordered_map>
#include <unordered_set>

namespace phonemis::phonemizer::constants {

// Alphabet-related constants
namespace alphabet {
// Acceptable number suffixes
// Cause numbers to be converted into ordinal instead of cardinal representation
inline const std::unordered_set<std::string> kOrdinalSuffixes = {"st", "nd",
                                                                 "rd", "th"};

inline const std::unordered_map<char, std::string> kAddSymbols = {
    {'.', "dot"}, {'/', "slash"}};

inline const std::unordered_map<char, std::string> kSymbols = {{'%', "percent"},
                                                               {'&', "and"},
                                                               {'+', "plus"},
                                                               {'@', "at"},
                                                               {'=', "equals"}};

inline const std::unordered_set<char> kPunctations = {';', ':', ',', '.', '!',
                                                      '?', '-', '"', '\''};

// Acceptable currencies (with spoken text representation)
// Maps currency signatures to it's spoken representation for both main and
// fractional units
inline const std::unordered_map<char32_t, std::pair<std::string, std::string>>
    kCurrencies = {{U'$', {"dolar", "cent"}},
                   {U'£', {"pound", "pence"}},
                   {U'€', {"euro", "cent"}}};
} // namespace alphabet

// Language (spoken) constants
namespace language {
inline const std::u32string kConsonants = U"bdfhjklmnpstvwzðŋɡɹɾʃʒʤʧθ";
inline const std::u32string kUSTaus = U"AIOWYiuæɑəɛɪɹʊʌ";
} // namespace language

// Stress calculation constants
namespace stress {
inline constexpr char32_t kPrimary = '\'';
inline constexpr char32_t kSecondary = ',';

inline const std::u32string kVowels = U"AIOQWYaiuæɑɒɔəɛɜɪʊʌᵻ";
} // namespace stress

} // namespace phonemis::phonemizer::constants