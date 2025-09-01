#pragma once

#include <vector>

#include "Word.h"

class Segment {
public:
  Segment(std::vector<Word> words, float noSpeechProbability) noexcept
      : words(std::move(words)), noSpeechProbability(noSpeechProbability) {}

  std::vector<Word> words;
  float noSpeechProbability;
};
