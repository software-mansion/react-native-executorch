#pragma once

#include <string>
#include <unordered_map>
#include <unordered_set>

namespace phonemis::phonemizer::constants {

// Control constants & hyperparameters
// Determine the behavior of the phonemization algorithms.
inline constexpr int32_t kMaxSyllabeLength =
    6; // See the fallback phonemization mechanism
inline constexpr int32_t kVowelSyllabePenalty =
    2; // See the fallback phonemization mechanism

// Alphabet-related constants
namespace alphabet {
inline const std::string kVowels = "aeiouy"; // Written vowels
inline const std::string kConsosants =
    "bcdfghjklmnpqrstvwxz"; // Written consosants

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

inline const std::unordered_set<char> kNonQuotePunctations = {
    ';', ':', ',', '.', '!', '?', '-', '\''};

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
inline const std::u32string kVowels = U"AIOQWYaiuæɑɒɔəɛɜɪʊʌᵻ"; // Spoken vowels
inline const std::u32string kConsonants =
    U"bdfhjklmnpstvwzðŋɡɹɾʃʒʤʧθ"; // Spoken consosants
inline const std::u32string kUSTaus = U"AIOWYiuæɑəɛɪɹʊʌ";
} // namespace language

// Stress calculation constants
namespace stress {
inline constexpr char32_t kPrimary = U'ˈ';
inline constexpr char32_t kSecondary = U'ˌ';
} // namespace stress

} // namespace phonemis::phonemizer::constants