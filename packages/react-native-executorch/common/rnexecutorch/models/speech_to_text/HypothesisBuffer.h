#pragma once

#include "Word.h"
#include <span>
#include <string>
#include <vector>

class HypothesisBuffer {
public:
  void insert(std::span<const Word> newWords, float offset);
  std::vector<Word> flush();
  void popCommitted(float time);
  std::vector<Word> complete() const;

  float lastCommittedTime = 0.0f;

private:
  std::vector<Word> committedInBuffer;
  std::vector<Word> buffer;
  std::vector<Word> fresh;
};
