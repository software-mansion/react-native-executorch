#pragma once

#include <mutex>
#include <optional>
#include <span>
#include <vector>

#include "../common/schema/OnlineASR.h"
#include "../common/types/ProcessResult.h"
#include "../common/types/Word.h"
#include "ASR.h"
#include <rnexecutorch/models/voice_activity_detection/VoiceActivityDetection.h>

namespace rnexecutorch::models::speech_to_text::whisper::stream {

using voice_activity_detection::VoiceActivityDetection;

/**
 * Online Automatic Speech Recognition (OnlineASR) for Whisper.
 * It manages continuous processing of audio stream by maintaining a local
 * audio buffer and using ASR to transcribe it in increments.
 */
class OnlineASR : public schema::OnlineASR {
public:
  OnlineASR(const ASR *asr, const VoiceActivityDetection *vad);

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
  ProcessResult process(const StreamingOptions &options) override;

  /**
   * Finalizes the current stream and returns all words.
   * @return Vector of detected words.
   */
  std::vector<Word> finish(const StreamingOptions &options) override;

  /**
   * Resets the internal state and clears buffers.
   */
  void reset() override;

private:
  // Cleans up the buffer and returns committed words based on given transcript.
  std::vector<Word> commitAndClean(std::vector<Word> &transcript);

  // ASR module connection for transcribing the audio
  const ASR *asr_;

  // VAD module connection for selecting processing (optional)
  const VoiceActivityDetection *vad_;

  // Audio buffer (input) - accumulates obtained audio samples.
  std::vector<float> audioBuffer_ = {};
  mutable std::mutex streamingMutex; // Covers both buffer & memory

  // Streaming memory.
  // In general, helps to navigate continous streaming state and improve buffer
  // handling algorithms.
  struct Memory {
    // State management helper.
    struct EOSEntry {
      size_t position; // An absolute position (index) in the transcription
                       // (word sequence).
      std::string preceeding; // A preceeding word in the transcription
      float tmstpend;         // Ending timestamp of the sentence.
    };

    std::vector<Word>
        transcript; // The most recent transcription result (uncommitted only!).
    std::vector<EOSEntry>
        eos; // End of sentence points from the most recent transcription.
    std::vector<Word> toCommit; // Words to be committed in the next iteration
                                // (next process() call).
  } memory_;
};

} // namespace rnexecutorch::models::speech_to_text::whisper::stream
