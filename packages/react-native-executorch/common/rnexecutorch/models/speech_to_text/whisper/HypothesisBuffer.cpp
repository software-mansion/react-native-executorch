#include "HypothesisBuffer.h"
#include "Params.h"
#include "Utils.h"
#include <cmath>

namespace rnexecutorch::models::speech_to_text::whisper::stream {

void HypothesisBuffer::insert(std::span<const Word> words, float offset) {
  // Step 1 - decide which words should be considered as fresh.
  // Using less amount of fresh words saves a little bit of time, but
  // could backfire in terms of quality of the final committed transcript.
  fresh_.clear();
  for (const Word &word : words) {
    // Global start is a beginning timestamp relative only to the beginning of
    // the current streaming process.
    const float startGlobal = word.start + offset;
    const float endGlobal = word.end + offset;

    // To optimize the process, we discard the words which are too old
    // according to the calculated timestamp.
    if (startGlobal > lastCommittedTime_ - params::kStreamFreshThreshold) {
      fresh_.emplace_back(word.content, startGlobal, endGlobal);
    }
  }

  // Step 2 - we have already selected the fresh words. Now it's time to
  // correct any mistakes and remove the words which overlap with already
  // commited segments - to avoid duplicates.
  if (!fresh_.empty() && !committed_.empty()) {
    const float freshSequenceStart = fresh_.front().start;
    const float freshSequenceEnd = fresh_.back().end;

    // Calculate the largest overlapping fragment size.
    // Note that we use size limit (kStreamMaxOverlapSize) for efficiency of the
    // algorithm, and timestamp difference limit
    // (kStreamMaxOverlapTimestampDiff) to avoid removing correct fragments
    // which were just repeated after some time.
    size_t overlapSize = utils::findLargestOverlapingFragment(
        committed_, fresh_, params::kStreamMaxOverlapSize,
        params::kStreamMaxOverlapTimestampDiff);

    // Remove all the overlapping words.
    if (overlapSize > 0) {
      fresh_.erase(fresh_.begin(), fresh_.begin() + overlapSize);
    }
  }
}

std::deque<Word> HypothesisBuffer::commit() {
  std::deque<Word> toCommit = {};

  // Find a stable prefix: words that haven't changed between last and current
  // iteration.
  while (!fresh_.empty() && !hypothesis_.empty() &&
         fresh_.front().content == hypothesis_.front().content) {
    toCommit.emplace_back(
        std::move(hypothesis_.front())); // Timestamps from the previous
                                         // iteration tends to be more reliable
    fresh_.pop_front();
    hypothesis_.pop_front();
  }

  // Save the last committed word timestamp.
  // This will mark the end of the entire committed sequence.
  if (!toCommit.empty()) {
    lastCommittedTime_ = toCommit.back().end;
  }

  // The remaining words from the fresh buffer (uncommitted phrase)
  // become a hypothesis for the next iteration.
  hypothesis_ = std::move(fresh_);
  fresh_.clear();

  // The last step is to commit the selected words.
  committed_.insert(committed_.end(), toCommit.cbegin(), toCommit.cend());

  return toCommit;
}

void HypothesisBuffer::releaseCommits(size_t wordsToKeep) {
  if (committed_.size() > wordsToKeep) {
    size_t nWordsToErase = committed_.size() - wordsToKeep;
    committed_.erase(committed_.begin(), committed_.begin() + nWordsToErase);
  }
}

void HypothesisBuffer::reset() {
  fresh_.clear();
  hypothesis_.clear();
  committed_.clear();

  lastCommittedTime_ = 0.f;
}

} // namespace rnexecutorch::models::speech_to_text::whisper::stream
