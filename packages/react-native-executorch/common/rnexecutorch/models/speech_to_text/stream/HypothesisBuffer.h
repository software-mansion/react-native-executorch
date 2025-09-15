#pragma once

#include <deque>
#include <span>

#include "rnexecutorch/models/speech_to_text/types/Word.h"

namespace rnexecutorch::models::speech_to_text::stream {

class HypothesisBuffer {
public:
  void insert(std::span<const types::Word> newWords, float offset);
  std::deque<types::Word> flush();
  void popCommitted(float time);
  std::deque<types::Word> complete() const;

private:
  float lastCommittedTime = 0.0f;

  std::deque<types::Word> committedInBuffer;
  std::deque<types::Word> buffer;
  std::deque<types::Word> fresh;
};

} // namespace rnexecutorch::models::speech_to_text::stream
