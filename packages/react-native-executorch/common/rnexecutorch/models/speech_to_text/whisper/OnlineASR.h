#pragma once

#include "../common/schema/OnlineASR.h"
#include "../common/types/ProcessResult.h"
#include "../common/types/Segment.h"
#include "../common/types/Word.h"
#include "ASR.h"
#include "HypothesisBuffer.h"

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
   * Appends new audio samples to the internal processing buffer.
   *
   * @param audio A span of PCM float samples (expected 16kHz).
   */
  void insertAudioChunk(std::span<const float> audio) override;

  /**
   * Determines whether the model is ready to process the next iteration.
   *
   * @return True if audioBuffer has enough samples, False otherwise
   */
  bool isReady() const override;

  /**
   * Processes the current audio buffer and returns new transcription results.
   * Stability is managed by an internal HypothesisBuffer to ensure that
   * only confirmed (stable) text is returned as "committed".
   *
   * @param options Decoding configuration (language, etc.).
   * @return        A ProcessResult containing newly committed and uncommitted
   * words.
   */
  ProcessResult process(const DecodingOptions &options) override;

  /**
   * Finalizes the current streaming session.
   * Flushes any remaining words from the hypothesis buffer.
   *
   * @return A vector of remaining transcribed words.
   */
  std::vector<Word> finish() override;

  /**
   * Reset the streaming state by resetting the buffers
   */
  void reset() override;

private:
  // ASR module connection for transcribing the audio
  const ASR *asr_;

  // Helper buffers - audio buffer
  // Stores the increasing amounts of streamed audio.
  // Cleared from time to time after reaching a threshold size.
  std::vector<float> audioBuffer_ = {};
  float bufferTimeOffset_ = 0.f; // Audio buffer offset

  // Helper buffers - hypothesis buffer
  // Manages the whisper streaming hypothesis mechanism.
  HypothesisBuffer hypothesisBuffer_;
};

} // namespace rnexecutorch::models::speech_to_text::whisper::stream