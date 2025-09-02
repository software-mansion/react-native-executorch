#pragma once

#include <vector>

#include "Word.h"

struct Segment {
  std::vector<Word> words;
  float noSpeechProbability;
};
