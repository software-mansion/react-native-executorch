#pragma once

#include "constants.h"

namespace phonemis::phonemizer {

// Applies given amount of stress to the phonemized string
std::u32string apply_stress(const std::u32string &phonemes, float stress);

// Moves the stress mark so that the stress is placed directly before the
// nearest vowel
std::u32string restress(const std::u32string &phonemes);

} // namespace phonemis::phonemizer