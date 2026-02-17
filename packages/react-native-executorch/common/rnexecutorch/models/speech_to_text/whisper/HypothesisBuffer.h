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
   * Inserts new words into the hypothesis buffer.
   * Words are filtered based on the last committed time and checked for
   * overlaps with existing committed words to prevent duplicates.
   *
   * @param newWords A span of newly generated words.
   * @param offset   Time offset to adjust the word timestamps.
   */
  void insert(std::span<const Word> newWords, float offset);

  /**
   * Moves stable words from the hypothesis into the committed buffer.
   * It compares the new hypothesis (fresh) with the previous one (buffer)
   * and returns the common prefix as committed words.
   *
   * @return A deque of words that have been newly committed.
   */
  std::deque<Word> flush();

  /**
   * Cleans up the history of committed words up to a certain timestamp.
   *
   * @param time The timestamp limit; words ending before this time are removed.
   */
  void popCommitted(float time);

  /**
   * Retrieves the current uncommitted hypothesis.
   *
   * @return A deque containing the words currently in the buffer.
   */
  std::deque<Word> complete() const;

  /**
   * Resets all the stored buffers to the initial state
   */
  void reset();

private:
  float lastCommittedTime_ = 0.0f;

  // Stored buffers
  std::deque<Word> buffer_;
  std::deque<Word> fresh_;
  std::deque<Word> committedInBuffer_;
};

} // namespace rnexecutorch::models::speech_to_text::whisper::stream
