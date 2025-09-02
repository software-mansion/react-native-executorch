#pragma once

#include <span>

#include "rnexecutorch/models/speech_to_text/types/Word.h"

class HypothesisBuffer {
public:
  void insert(std::span<const Word> newWords, float offset);
  std::vector<Word> flush();
  void popCommitted(float time);
  std::vector<Word> complete() const;

private:
  float lastCommittedTime = 0.0f;

  std::vector<Word> committedInBuffer;
  std::vector<Word> buffer;
  std::vector<Word> fresh;
};
