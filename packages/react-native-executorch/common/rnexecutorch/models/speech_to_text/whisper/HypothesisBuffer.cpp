#include "HypothesisBuffer.h"
#include "Params.h"
#include "Utils.h"
#include <cmath>

namespace rnexecutorch::models::speech_to_text::whisper::stream {

void HypothesisBuffer::insert(std::span<const Word> words, float offset) {
  // Step 1 - decide which words should be considered as fresh.
  fresh_.clear();

  // We try to find the last committed word in a transcription string.
  // Everything beyond that word will be considered as fresh.
  // To make the algorithm more resilient to repeated strings of words,
  // we check also the preceeding words as well as timestamps (with liberal
  // range).
  size_t firstFreshWordIdx = 0;
  if (!committed_.empty()) {
    std::optional<size_t> lastMatchingWordIdx =
        findCommittedSuffix(words, 5, 6.F, 5);
    firstFreshWordIdx = lastMatchingWordIdx.value_or(0);
  }

  for (size_t i = firstFreshWordIdx; i < words.size(); i++) {
    const auto &word = words[i];

    // Global start is a beginning timestamp relative only to the beginning of
    // the current streaming process.
    const float startGlobal = word.start + offset;
    const float endGlobal = word.end + offset;

    if (startGlobal > lastCommittedTime_ - 3.F) {
      fresh_.emplace_back(word.content, startGlobal, endGlobal,
                          word.punctations);
    }
  }

  // Step 2 - we have already selected the fresh words. Now it's time to
  // correct any mistakes and remove the words which overlap with already
  // commited segments - to avoid duplicates.
  if (!fresh_.empty() && !committed_.empty()) {
    // Calculate the largest overlapping fragment size.
    // Note that we use size limit (kStreamMaxOverlapSize) for efficiency of the
    // algorithm, and timestamp difference limit
    // (kStreamMaxOverlapTimestampDiff) to avoid removing correct fragments
    // which were just repeated after some time.
    size_t overlapSize = utils::findLargestOverlapingFragment(
        committed_, fresh_, params::kStreamMaxOverlapSize,
        params::kStreamMaxOverlapTimestampDiff);

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
    // The last word from the fresh_ buffer must also match punctations with the
    // hypothesis. This is done in order to ensure correct punctation marks in
    // the resulting transcription.
    if (fresh_.size() == 1 &&
        fresh_.front().punctations != hypothesis_.front().punctations) {
      break;
    }

    // Take timestamps from the hypothesis, but actual content from the fresh
    // buffer.
    toCommit.emplace_back(std::move(fresh_.front().content),
                          hypothesis_.front().start, hypothesis_.front().end,
                          std::move(fresh_.front().punctations));
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

std::optional<size_t> HypothesisBuffer::findCommittedSuffix(
    std::span<const Word> words, size_t nCommitted,
    float timestampDiffTolerance, size_t wordsPerMistake) {
  if (words.empty() || committed_.empty() || nCommitted == 0) {
    return std::nullopt;
  }

  // Determine the subset size of committed words to check against.
  size_t committedToMatchSize = std::min(nCommitted, committed_.size());

  // Iterate backwards through 'words' to find the most recent occurrence of a
  // suffix of 'committed_' (or the full 'committed_' sequence).
  for (int i = static_cast<int>(words.size()) - 1; i >= 0; --i) {
    bool match = true;
    size_t matchedCount = 0;
    size_t contentMistakeCount = 0;

    // Linearly interpolate tolerance if we are at the beginning and can't check
    // all committed words.
    float effectiveTolerance = timestampDiffTolerance;
    if (i < static_cast<int>(committedToMatchSize) - 1) {
      effectiveTolerance *=
          static_cast<float>(i + 1) / static_cast<float>(committedToMatchSize);
    }

    // Try to match backwards from words[i] and committed_.back()
    for (size_t j = 0; j < committedToMatchSize; ++j) {
      int wordsIdx = i - static_cast<int>(j);
      int committedIdx =
          static_cast<int>(committed_.size()) - 1 - static_cast<int>(j);

      if (wordsIdx < 0) {
        // We reached the beginning of the words span.
        // The algorithm allows matching a partial prefix if it's at the start.
        break;
      }

      const Word &w1 = words[wordsIdx];
      const Word &w2 = committed_[committedIdx];

      // Check timestamps within tolerance
      if (std::abs(w1.start - w2.start) > effectiveTolerance ||
          std::abs(w1.end - w2.end) > effectiveTolerance) {
        match = false;
        break;
      }

      // Allow sparse content mismatches while still treating the overall
      // sequence as matching.
      if (utils::equalsIgnoreCase(w1.content, w2.content)) {
        matchedCount++;
      } else {
        contentMistakeCount++;
      }

      // Early exit if mistake count already exceeds what we can recover from
      // given the remaining words to check.
      if (wordsPerMistake > 0) {
        size_t remainingToMatch = committedToMatchSize - 1 - j;
        size_t maxPossibleMatched = matchedCount + remainingToMatch;
        if (contentMistakeCount > (maxPossibleMatched / wordsPerMistake)) {
          match = false;
          break;
        }
      }
    }

    // One content mistake is allowed per M matched words.
    size_t maxAllowedMistakes =
        (wordsPerMistake == 0) ? 0 : (matchedCount / wordsPerMistake);

    if (match && matchedCount > 0 &&
        contentMistakeCount <= maxAllowedMistakes) {
      return static_cast<size_t>(i);
    }
  }

  return std::nullopt;
}

} // namespace rnexecutorch::models::speech_to_text::whisper::stream
