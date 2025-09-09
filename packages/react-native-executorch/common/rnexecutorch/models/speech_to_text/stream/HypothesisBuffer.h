#pragma once

#include <deque>
#include <span>

#include "rnexecutorch/models/speech_to_text/types/Word.h"

namespace rnexecutorch::models::speech_to_text::stream {

using namespace types;

class HypothesisBuffer {
public:
  void insert(std::span<const Word> newWords, float offset);
  std::deque<Word> flush();
  void popCommitted(float time);
  std::deque<Word> complete() const;

private:
  float lastCommittedTime = 0.0f;

  std::deque<Word> committedInBuffer;
  std::deque<Word> buffer;
  std::deque<Word> fresh;
};

} // namespace rnexecutorch::models::speech_to_text::stream
