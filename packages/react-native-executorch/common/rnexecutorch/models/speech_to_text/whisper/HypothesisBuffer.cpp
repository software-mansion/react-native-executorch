#include "HypothesisBuffer.h"

namespace rnexecutorch::models::speech_to_text::whisper::stream {

void HypothesisBuffer::insert(std::span<const Word> newWords, float offset) {
  fresh_.clear();
  for (const auto &word : newWords) {
    const float newStart = word.start + offset;
    if (newStart > lastCommittedTime_ - 0.5f) {
      fresh_.emplace_back(word.content, newStart, word.end + offset);
    }
  }

  if (!fresh_.empty() && !committedInBuffer_.empty()) {
    const float a = fresh_.front().start;
    if (std::fabs(a - lastCommittedTime_) < 1.0f) {
      const size_t cn = committedInBuffer_.size();
      const size_t nn = fresh_.size();
      const std::size_t maxCheck = std::min<std::size_t>({cn, nn, 5});
      for (size_t i = 1; i <= maxCheck; i++) {
        std::string c;
        for (auto it = committedInBuffer_.cend() - i;
             it != committedInBuffer_.cend(); ++it) {
          if (!c.empty()) {
            c += ' ';
          }
          c += it->content;
        }

        std::string tail;
        auto it = fresh_.cbegin();
        for (size_t k = 0; k < i; k++, it++) {
          if (!tail.empty()) {
            tail += ' ';
          }
          tail += it->content;
        }

        if (c == tail) {
          fresh_.erase(fresh_.begin(), fresh_.begin() + i);
          break;
        }
      }
    }
  }
}

std::deque<Word> HypothesisBuffer::flush() {
  std::deque<Word> commit;

  while (!fresh_.empty() && !buffer_.empty()) {
    if (fresh_.front().content != buffer_.front().content) {
      break;
    }
    commit.push_back(fresh_.front());
    buffer_.pop_front();
    fresh_.pop_front();
  }

  if (!commit.empty()) {
    lastCommittedTime_ = commit.back().end;
  }

  buffer_ = std::move(fresh_);
  fresh_.clear();
  committedInBuffer_.insert(committedInBuffer_.end(), commit.begin(),
                            commit.end());
  return commit;
}

void HypothesisBuffer::popCommitted(float time) {
  while (!committedInBuffer_.empty() &&
         committedInBuffer_.front().end <= time) {
    committedInBuffer_.pop_front();
  }
}

std::deque<Word> HypothesisBuffer::complete() const { return buffer_; }

void HypothesisBuffer::reset() {
  buffer_.clear();
  fresh_.clear();
  committedInBuffer_.clear();
}

} // namespace rnexecutorch::models::speech_to_text::whisper::stream
