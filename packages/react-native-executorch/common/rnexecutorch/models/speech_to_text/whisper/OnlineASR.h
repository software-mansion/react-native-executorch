#pragma once

#include <mutex>
#include <span>
#include <vector>

#include "../common/schema/OnlineASR.h"
#include "../common/types/ProcessResult.h"
#include "../common/types/Word.h"
#include "ASR.h"

namespace rnexecutorch::models::speech_to_text::whisper::stream {

/**
 * Online Automatic Speech Recognition (OnlineASR) for Whisper.
 * It manages continuous processing of audio stream by maintaining a local
 * audio buffer and using ASR to transcribe it in increments.
 */
class OnlineASR : public schema::OnlineASR {
public:
  OnlineASR(const ASR *asr);

  /**
   * Checks if the buffer contains enough audio for the next processing step.
   * @return True if ready, false otherwise.
   */
  bool isReady() const override;

  /**
   * Appends audio samples to the internal buffer.
   * @param audio Span containing the audio data.
   */
  void insertAudioChunk(std::span<const float> audio) override;

  /**
   * Processes the current buffered audio and returns transcription results.
   * @param options Decoding options for the transcription.
   * @return Transcription result containing committed and volatile tokens.
   */
  ProcessResult process(const DecodingOptions &options) override;

  /**
   * Finalizes the current stream and returns all words.
   * @return Vector of detected words.
   */
  std::vector<Word> finish(const DecodingOptions &options) override;

  /**
   * Resets the internal state and clears buffers.
   */
  void reset() override;

private:
  // ASR module connection for transcribing the audio
  const ASR *asr_;

  // Audio buffer (input) - accumulates obtained audio samples.
  std::vector<float> audioBuffer_ = {};
  mutable std::mutex audioBufferMutex_;

  // State management helper.
  struct EOSEntry {
    size_t position; // An absolute position (index) in the transcription (word
                     // sequence).
    std::string preceeding; // A preceeding word in the transcription
    float tmstpend;         // Ending timestamp of the sentence.
  };
  // Stores saved EOS entries in most recent transcription
  // and allows to clear the buffer in a smart, non invasive way.
  std::vector<EOSEntry> eos_;
};

} // namespace rnexecutorch::models::speech_to_text::whisper::stream
