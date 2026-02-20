#pragma once

#include <deque>
#include <span>

#include "../common/types/Word.h"

namespace rnexecutorch::models::speech_to_text::whisper::stream {

/**
 * A buffer for managing streaming transcription hypotheses.
 * This class handles stabilization of the transcription result by tracking
 * "fresh" hypotheses and "committing" them once they are stable across updates.
 */
class HypothesisBuffer {
public:
  /**
   * Inserts new words into the fresh_ buffer.
   * Words are filtered based on the last committed time and checked for
   * overlaps with existing committed words to prevent duplicates.
   *
   * @param newWords A span of recently generated words.
   * @param offset   Time offset to adjust the word timestamps.
   */
  void insert(std::span<const Word> words, float offset);

  /**
   * Attempts to commit words present in the fresh_ buffer.
   * A phrase from fresh_ buffer can only be committed if it also appears
   * in the hypothesis_ buffer (uncommitted words from previous iteration).
   *
   * Uncommitted words become a 'hypothesis' and are moved into the hypothesis_
   * buffer.
   *
   * @return A sequence of words committed in the current iteration.
   */
  std::deque<Word> commit();

  /**
   * Shrinks the committed_ buffer by erasing all words except N latest ones.
   *
   * Used primarily to relieve increasing memory usage during very
   * long streaming sessions.
   *
   * @param wordsToKeep - number of trailing words to be kept in.
   */
  void releaseCommits(size_t wordsToKeep);

  /**
   * Resets all the stored buffers and state variables to the initial state
   */
  void reset();

  // Declare a friendship with OnlineASR to allow it to access the internal
  // state of stored buffers.
  friend class OnlineASR;

private:
  // Stored buffers
  // The lifecycle of a correct result word looks as following:
  // fresh buffer -> hypothesis buffer -> commited
  std::deque<Word>
      fresh_; // 'New' words from current iterations, which require some checks
              // before they go into hypothesis_ buffer.
  std::deque<Word>
      hypothesis_; // Words potentially to be commited, stored between
                   // iterations (obtained from fresh_ buffer).
  std::deque<Word> committed_; // A history of already commited words.

  float lastCommittedTime_ = 0.0f;
};

} // namespace rnexecutorch::models::speech_to_text::whisper::stream
