#include "HypothesisBuffer.h"

namespace rnexecutorch::models::speech_to_text::stream {

void HypothesisBuffer::insert(std::span<const Word> newWords, float offset) {
  std::vector<Word> newWordsOffset;
  newWordsOffset.reserve(newWords.size());
  for (const auto &w : newWords) {
    newWordsOffset.emplace_back(w.content, w.start + offset, w.end + offset);
  }

  fresh.clear();
  for (const auto &w : newWordsOffset) {
    if (w.start > lastCommittedTime - 0.5f) {
      fresh.push_back(w);
    }
  }

  if (!fresh.empty() && !committedInBuffer.empty()) {
    float a = fresh.front().start;
    if (std::fabs(a - lastCommittedTime) < 1.0f) {
      size_t cn = committedInBuffer.size();
      size_t nn = fresh.size();
      const std::size_t maxCheck = std::min<std::size_t>({cn, nn, 5});
      for (size_t i = 1; i <= maxCheck; i++) {
        std::string c;
        for (auto it = committedInBuffer.end() - i;
             it != committedInBuffer.end(); ++it) {
          if (!c.empty()) {
            c += ' ';
          }
          c += it->content;
        }

        std::string tail;
        for (size_t k = 0; k < i; k++) {
          if (!tail.empty()) {
            tail += ' ';
          }
          tail += fresh[k].content;
        }

        if (c == tail) {
          fresh.erase(fresh.begin(), fresh.begin() + i);
          break;
        }
      }
    }
  }
}

std::vector<Word> HypothesisBuffer::flush() {
  std::vector<Word> commit;

  while (!fresh.empty() && !buffer.empty()) {
    if (fresh.front().content != buffer.front().content) {
      break;
    }
    commit.push_back(fresh.front());
    lastCommittedTime = fresh.front().end;
    buffer.erase(buffer.begin());
    fresh.erase(fresh.begin());
  }

  buffer = fresh;
  fresh.clear();
  committedInBuffer.insert(committedInBuffer.end(), commit.begin(),
                           commit.end());
  return commit;
}

void HypothesisBuffer::popCommitted(float time) {
  committedInBuffer.erase(
      std::remove_if(committedInBuffer.begin(), committedInBuffer.end(),
                     [&](const Word &w) { return w.end <= time; }),
      committedInBuffer.end());
}

std::vector<Word> HypothesisBuffer::complete() const { return buffer; }

} // namespace rnexecutorch::models::speech_to_text::stream
