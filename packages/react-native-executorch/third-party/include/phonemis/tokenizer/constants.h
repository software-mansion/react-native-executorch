#pragma once

#include "types.h"
#include <array>
#include <string>
#include <unordered_set>

namespace phonemis::tokenizer::constants {

// Special characters and their separation rules
inline constexpr std::array<SpecialCharacter, 4> kSpecialCharacters = {
    SpecialCharacter{'\'',
                     rules::Separation::JOIN_LEFT}, // Apostrophe joins left
    SpecialCharacter{'-',
                     rules::Separation::TOTAL_DIVIDE}, // Hyphen always divides
    SpecialCharacter{'.',
                     rules::Separation::TOTAL_DIVIDE},   // Dot always divides
    SpecialCharacter{':', rules::Separation::TOTAL_JOIN} // Colon always joins
};

// A set of special words, which can contain special characters as
// an integral part.
// Note that all of the words are lower case.
inline const std::unordered_set<std::string> kSpecialWords = {
    // Contractions
    "'bout", "'d", "'em", "'ll", "'m", "'re", "'s", "'ve", "can't", "cain't",
    "goin'", "let's", "ma'am", "musn't", "n't", "nothin'", "o'clock", "o'er",
    "out'n", "po'k", "pop'lar", "somethin'", "tain't", "we'uns", "what's",
    "y'know", "yesterday's", "you'uns", "y'all",

    // Abbreviations and acronyms
    "a.m.", "aug.", "b.c.", "bros.", "co.", "corp.", "dr.", "e.g.", "feb.",
    "f.b.i.", "f.d.r.", "fla.", "gen.", "gov.", "inc.", "jan.", "jr.", "ltd.",
    "mar.", "mass.", "md.", "mich.", "minn.", "miss.", "mo.", "mont.", "mr.",
    "mrs.", "mt.", "n.a.", "n.c.", "n.j.", "n.y.", "nov.", "oct.", "okla.",
    "ore.", "pa.", "prof.", "rev.", "sept.", "st.", "tenn.", "u.n.", "u.s.",
    "u.s.a.", "u.s.s.r.", "va.", "wash.", "wis.", "p.m.", "vs.",

    // Hyphenated and special forms
    "and/or", "aujourd'hui", "cap'n", "i.e.", "mid-19th", "mid-20th",
    "mid-21st", "pre-1960", "rock'n'roll", "state's", "year-'round"};

} // namespace phonemis::tokenizer::constants