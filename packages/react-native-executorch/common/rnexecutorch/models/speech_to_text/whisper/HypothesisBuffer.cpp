#include "HypothesisBuffer.h"
#include "Params.h"
#include "Utils.h"
#include <cmath>
#include <rnexecutorch/Log.h>

namespace rnexecutorch::models::speech_to_text::whisper::stream {

void HypothesisBuffer::insert(std::span<const Word> newWords, float offset) {
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[HypothesisBuffer] Inserting " +
                        std::to_string(newWords.size()) +
                        " words with offset " + std::to_string(offset) + "s.");

  fresh_.clear();
  for (const auto &word : newWords) {
    const float newStart = word.start + offset;
    // Only accept words that start after or near the last committed time to
    // avoid stale data
    if (newStart > lastCommittedTime_ - params::kStreamFreshThreshold) {
      fresh_.emplace_back(word.content, newStart, word.end + offset);
    }
  }
  rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                    "[HypothesisBuffer] Filtered " +
                        std::to_string(fresh_.size()) +
                        " words into 'fresh' buffer.");

  if (!fresh_.empty() && !committedInBuffer_.empty()) {
    const float a = fresh_.front().start;
    // Check for overlap with already committed history to avoid duplicates in
    // the stream
    if (std::fabs(a - lastCommittedTime_) < 2.0f) {
      const size_t cn = committedInBuffer_.size();
      const size_t nn = fresh_.size();

      rnexecutorch::log(
          rnexecutorch::LOG_LEVEL::Info,
          "[HypothesisBuffer] Checking for overlap. cn=" + std::to_string(cn) +
              ", nn=" + std::to_string(nn) +
              ", maxCheck=" + std::to_string(params::kStreamMaxOverlapSize));

      size_t overlapSize = utils::findLargestOverlapingFragment(
          committedInBuffer_, fresh_, params::kStreamMaxOverlapSize,
          params::kStreamMaxOverlapTimestampDiff);

      if (overlapSize > 0) {
        rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                          "[HypothesisBuffer] Detected overlap of " +
                              std::to_string(overlapSize) +
                              " words with committed history. Erasing "
                              "duplicates from 'fresh'.");
        fresh_.erase(fresh_.begin(), fresh_.begin() + overlapSize);
      }
    }
  }
}

std::deque<Word> HypothesisBuffer::flush() {
  std::deque<Word> commit;

  // Find stable prefix: words that haven't changed between last and current
  // iteration
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
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                      "[HypothesisBuffer] Found stable prefix. Committing " +
                          std::to_string(commit.size()) +
                          " words. New lastCommittedTime: " +
                          std::to_string(lastCommittedTime_) + "s.");
  }

  // Current 'fresh' (remaining) becomes the new 'buffer' for next iteration
  // comparison
  buffer_ = std::move(fresh_);
  fresh_.clear();

  committedInBuffer_.insert(committedInBuffer_.end(), commit.begin(),
                            commit.end());

  return commit;
}

void HypothesisBuffer::popCommitted(float time) {
  size_t count = 0;
  while (!committedInBuffer_.empty() &&
         committedInBuffer_.front().end <= time) {
    committedInBuffer_.pop_front();
    count++;
  }
  if (count > 0) {
    rnexecutorch::log(rnexecutorch::LOG_LEVEL::Info,
                      "[HypothesisBuffer] Popped " + std::to_string(count) +
                          " old words from committed history up to " +
                          std::to_string(time) + "s.");
  }
}

std::deque<Word> HypothesisBuffer::complete() const { return buffer_; }

void HypothesisBuffer::reset() {
  buffer_.clear();
  fresh_.clear();
  committedInBuffer_.clear();

  lastCommittedTime_ = 0.f;
}

} // namespace rnexecutorch::models::speech_to_text::whisper::stream
