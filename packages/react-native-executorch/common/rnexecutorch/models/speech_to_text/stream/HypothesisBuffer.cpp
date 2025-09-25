#include "HypothesisBuffer.h"

namespace rnexecutorch::models::speech_to_text::stream {

using namespace types;

void HypothesisBuffer::insert(std::span<const Word> newWords, float offset) {
  this->fresh.clear();
  for (const auto &word : newWords) {
    const float newStart = word.start + offset;
    if (newStart > lastCommittedTime - 0.5f) {
      this->fresh.emplace_back(word.content, newStart, word.end + offset);
    }
  }

  if (!this->fresh.empty() && !this->committedInBuffer.empty()) {
    const float a = this->fresh.front().start;
    if (std::fabs(a - lastCommittedTime) < 1.0f) {
      const size_t cn = this->committedInBuffer.size();
      const size_t nn = this->fresh.size();
      const std::size_t maxCheck = std::min<std::size_t>({cn, nn, 5});
      for (size_t i = 1; i <= maxCheck; i++) {
        std::string c;
        for (auto it = this->committedInBuffer.cend() - i;
             it != this->committedInBuffer.cend(); ++it) {
          if (!c.empty()) {
            c += ' ';
          }
          c += it->content;
        }

        std::string tail;
        auto it = this->fresh.cbegin();
        for (size_t k = 0; k < i; k++, it++) {
          if (!tail.empty()) {
            tail += ' ';
          }
          tail += it->content;
        }

        if (c == tail) {
          this->fresh.erase(this->fresh.begin(), this->fresh.begin() + i);
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
    this->buffer.pop_front();
    this->fresh.pop_front();
  }

  if (!commit.empty()) {
    lastCommittedTime = commit.back().end;
  }

  this->buffer = std::move(this->fresh);
  this->fresh.clear();
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
