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

// ---------------
// other constants
// ---------------
namespace constants {
// These are all characters that should end a correct english sentence
inline const std::unordered_set<char> kEndOfSentenceCharacters = {'.', '?', '!',
                                                                  ';'};
} // namespace constants

} // namespace phonemis::preprocessor