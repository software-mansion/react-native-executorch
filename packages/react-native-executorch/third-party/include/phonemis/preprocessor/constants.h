#pragma once

#include <cstdint>
#include <string>
#include <unordered_map>
#include <unordered_set>

namespace phonemis::preprocessor {

// -------------------
// num2words constants
// -------------------
namespace num2words::constants {
// Cards map: basic number -> word
inline const std::unordered_map<int, std::string> kCardinals = {
    {0, "zero"},     {1, "one"},        {2, "two"},       {3, "three"},
    {4, "four"},     {5, "five"},       {6, "six"},       {7, "seven"},
    {8, "eight"},    {9, "nine"},       {10, "ten"},      {11, "eleven"},
    {12, "twelve"},  {13, "thirteen"},  {14, "fourteen"}, {15, "fifteen"},
    {16, "sixteen"}, {17, "seventeen"}, {18, "eighteen"}, {19, "nineteen"},
    {20, "twenty"},  {30, "thirty"},    {40, "forty"},    {50, "fifty"},
    {60, "sixty"},   {70, "seventy"},   {80, "eighty"},   {90, "ninety"}};

// Ordinal exceptions: cardinal word -> ordinal word
inline const std::unordered_map<std::string, std::string> kOrdinals = {
    {"one", "first"},     {"two", "second"},   {"three", "third"},
    {"five", "fifth"},    {"eight", "eighth"}, {"nine", "ninth"},
    {"twelve", "twelfth"}};

// Large scale names: scale value -> name
inline const std::unordered_map<std::int64_t, std::string> kLargeCardinals = {
    {100, "hundred"},
    {1000, "thousand"},
    {1000000, "million"},
    {1000000000LL, "billion"},
    {1000000000000LL, "trillion"}};
} // namespace num2words::constants

// ----------------------------
// unicode processing constants
// ----------------------------
namespace unicode::constants {
// Foreign character to latin-only conversion
inline const std::unordered_map<char32_t, std::string> kForeignToLatin = {
    // Polish
    {U'Ą', "A"},
    {U'ą', "a"},
    {U'Ć', "C"},
    {U'ć', "c"},
    {U'Ę', "E"},
    {U'ę', "e"},
    {U'Ł', "L"},
    {U'ł', "l"},
    {U'Ń', "N"},
    {U'ń', "n"},
    {U'Ó', "O"},
    {U'ó', "o"},
    {U'Ś', "S"},
    {U'ś', "s"},
    {U'Ź', "Z"},
    {U'ź', "z"},
    {U'Ż', "Z"},
    {U'ż', "z"},

    // German
    {U'Ä', "A"},
    {U'ä', "a"},
    {U'Ö', "O"},
    {U'ö', "o"},
    {U'Ü', "U"},
    {U'ü', "u"},
    {U'ß', "ss"},

    // French
    {U'À', "A"},
    {U'à', "a"},
    {U'Â', "A"},
    {U'â', "a"},
    {U'Æ', "AE"},
    {U'æ', "ae"},
    {U'Ç', "C"},
    {U'ç', "c"},
    {U'É', "E"},
    {U'é', "e"},
    {U'È', "E"},
    {U'è', "e"},
    {U'Ê', "E"},
    {U'ê', "e"},
    {U'Ë', "E"},
    {U'ë', "e"},
    {U'Î', "I"},
    {U'î', "i"},
    {U'Ï', "I"},
    {U'ï', "i"},
    {U'Ô', "O"},
    {U'ô', "o"},
    {U'Œ', "OE"},
    {U'œ', "oe"},
    {U'Ù', "U"},
    {U'ù', "u"},
    {U'Û', "U"},
    {U'û', "u"},
    {U'Ü', "U"},
    {U'ü', "u"},

    // Spanish
    {U'Á', "A"},
    {U'á', "a"},
    {U'É', "E"},
    {U'é', "e"},
    {U'Í', "I"},
    {U'í', "i"},
    {U'Ó', "O"},
    {U'ó', "o"},
    {U'Ú', "U"},
    {U'ú', "u"},
    {U'Ü', "U"},
    {U'ü', "u"},
    {U'Ñ', "N"},
    {U'ñ', "n"},

    // Italian
    {U'À', "A"},
    {U'à', "a"},
    {U'È', "E"},
    {U'è', "e"},
    {U'É', "E"},
    {U'é', "e"},
    {U'Ì', "I"},
    {U'ì', "i"},
    {U'Í', "I"},
    {U'í', "i"},
    {U'Î', "I"},
    {U'î', "i"},
    {U'Ò', "O"},
    {U'ò', "o"},
    {U'Ó', "O"},
    {U'ó', "o"},
    {U'Ù', "U"},
    {U'ù', "u"},
    {U'Ú', "U"},
    {U'ú', "u"},

    // Scandinavian
    {U'Å', "A"},
    {U'å', "a"},
    {U'Æ', "AE"},
    {U'æ', "ae"},
    {U'Ø', "O"},
    {U'ø', "o"},

    // Hungarian
    {U'Á', "A"},
    {U'á', "a"},
    {U'É', "E"},
    {U'é', "e"},
    {U'Í', "I"},
    {U'í', "i"},
    {U'Ó', "O"},
    {U'ó', "o"},
    {U'Ö', "O"},
    {U'ö', "o"},
    {U'Ő', "O"},
    {U'ő', "o"},
    {U'Ú', "U"},
    {U'ú', "u"},
    {U'Ü', "U"},
    {U'ü', "u"},
    {U'Ű', "U"},
    {U'ű', "u"},

    // Czech/Slovak
    {U'Á', "A"},
    {U'á', "a"},
    {U'Č', "C"},
    {U'č', "c"},
    {U'Ď', "D"},
    {U'ď', "d"},
    {U'É', "E"},
    {U'é', "e"},
    {U'Ě', "E"},
    {U'ě', "e"},
    {U'Í', "I"},
    {U'í', "i"},
    {U'Ň', "N"},
    {U'ň', "n"},
    {U'Ó', "O"},
    {U'ó', "o"},
    {U'Ř', "R"},
    {U'ř', "r"},
    {U'Š', "S"},
    {U'š', "s"},
    {U'Ť', "T"},
    {U'ť', "t"},
    {U'Ú', "U"},
    {U'ú', "u"},
    {U'Ů', "U"},
    {U'ů', "u"},
    {U'Ý', "Y"},
    {U'ý', "y"},
    {U'Ž', "Z"},
    {U'ž', "z"},

    // Romanian
    {U'Ă', "A"},
    {U'ă', "a"},
    {U'Â', "A"},
    {U'â', "a"},
    {U'Î', "I"},
    {U'î', "i"},
    {U'Ș', "S"},
    {U'ș', "s"},
    {U'Ț', "T"},
    {U'ț', "t"}};
} // namespace unicode::constants

// ---------------
// other constants
// ---------------
namespace constants {
// These are all characters that should end a correct english sentence
inline const std::unordered_set<char> kEndOfSentenceCharacters = {'.', '?', '!',
                                                                  ';'};
} // namespace constants

} // namespace phonemis::preprocessor