#include "HypothesisBuffer.h"

namespace rnexecutorch::models::speech_to_text::stream {

void HypothesisBuffer::insert(std::span<const Word> newWords, float offset) {
  std::vector<Word> newWordsOffset;
  newWordsOffset.reserve(newWords.size());
  for (const auto &w : newWords) {
    newWordsOffset.emplace_back(w.content, w.start + offset, w.end + offset);
  }

  this->fresh.clear();
  for (const auto &w : newWordsOffset) {
    if (w.start > lastCommittedTime - 0.5f) {
      this->fresh.push_back(w);
    }
  }

  if (!this->fresh.empty() && !this->committedInBuffer.empty()) {
    float a = this->fresh.front().start;
    if (std::fabs(a - lastCommittedTime) < 1.0f) {
      size_t cn = this->committedInBuffer.size();
      size_t nn = this->fresh.size();
      const std::size_t maxCheck = std::min<std::size_t>({cn, nn, 5});
      for (size_t i = 1; i <= maxCheck; i++) {
        std::string c;
        for (auto it = this->committedInBuffer.end() - i;
             it != this->committedInBuffer.end(); ++it) {
          if (!c.empty()) {
            c += ' ';
          }
          c += it->content;
        }

        std::string tail;
        auto it = this->fresh.begin();
        for (size_t k = 0; k < i; k++, it++) {
          if (!tail.empty()) {
            tail += ' ';
          }
          tail += it->content;
        }

        if (c == tail) {
          for (size_t j = 0; j < i; ++j) {
            this->fresh.pop_front();
          }
          break;
        }
      }
    }
  }
}

std::deque<Word> HypothesisBuffer::flush() {
  std::deque<Word> commit;

  while (!this->fresh.empty() && !this->buffer.empty()) {
    if (this->fresh.front().content != this->buffer.front().content) {
      break;
    }
    commit.push_back(this->fresh.front());
    lastCommittedTime = this->fresh.front().end;
    this->buffer.pop_front();
    this->fresh.pop_front();
  }

  this->buffer = std::move(this->fresh);
  this->committedInBuffer.insert(this->committedInBuffer.end(), commit.begin(),
                                 commit.end());
  return commit;
}

void HypothesisBuffer::popCommitted(float time) {
  while (!this->committedInBuffer.empty() &&
         this->committedInBuffer.front().end <= time) {
    this->committedInBuffer.pop_front();
  }
}

std::deque<Word> HypothesisBuffer::complete() const { return this->buffer; }

} // namespace rnexecutorch::models::speech_to_text::stream
