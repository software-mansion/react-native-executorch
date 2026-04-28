#pragma once

#include <array>
#include <atomic>
#include <memory>
#include <optional>
#include <string>
#include <vector>

#include "DurationPredictor.h"
#include "Partitioner.h"
#include "Synthesizer.h"
#include "Types.h"
#include <phonemis/base/pipeline.h>
#include <rnexecutorch/metaprogramming/ConstructorHelpers.h>

namespace rnexecutorch {
namespace models::text_to_speech::kokoro {

class Kokoro {
public:
  Kokoro(const std::string &lang, const std::string &taggerDataSource,
         const std::string &lexiconSource, const std::string &neuralModelSource,
         const std::string &durationPredictorSource,
         const std::string &synthesizerSource, const std::string &voiceSource,
         std::shared_ptr<react::CallInvoker> callInvoker);

  /**
   * Generates complete audio for the provided text.
   *
   * @param text The input to be synthesized - either a raw text or IPA
   * phonemes.
   * @param speed Playback speed multiplier (default: 1.0).
   * @param phonemize Optional, if set to false disables the phonemization and
   * operates on raw input.
   * @return A vector of PCM float samples representing the synthesized speech.
   */
  std::vector<float> generate(std::u32string input, float speed = 1.F,
                              bool phonemize = true);

  /**
   * Starts an asynchronous streaming process that processes text in chunks.
   * The internal buffer can be expanded during streaming using `streamInsert`.
   *
   * @param callback A JSI function called with each generated audio chunk
   * (std::vector<float>).
   * @param speed Playback speed multiplier.
   * @param phonemize Optional, if set to false disables the phonemization and
   * operates on raw input.
   * @param stopOnEmptyBuffer If true, streaming terminates automatically when
   * the buffer is exhausted.
   */
  void stream(std::shared_ptr<jsi::Function> callback, float speed = 1.F,
              bool phonemize = true, bool stopOnEmptyBuffer = false);

  /**
   * Appends new text to the streaming input buffer.
   *
   * @param textChunk The text to add to the end of the current buffer.
   */
  void streamInsert(std::string textChunk) noexcept;

  /**
   * Signals the streaming process to stop.
   *
   * @param instant If true, stops immediately, discarding remaining buffered
   * text. If false, finishes processing the current buffer before stopping.
   */
  void streamStop(bool instant) noexcept;

  std::size_t getMemoryLowerBound() const noexcept;
  void unload() noexcept;

private:
  // Helper function - loading voice array
  void loadVoice(const std::string &voiceSource);

  // Helper function - generate specialization for given input size
  std::vector<float> synthesize(std::u32string_view phonemes, float speed,
                                size_t paddingMs = 50);

  // JS callback handle
  std::shared_ptr<react::CallInvoker> callInvoker_;

  // Shared model context
  Context context_;

  // Submodules - arranged in order of their appearence in the model's pipeline
  phonemis::Pipeline phonemizer_;
  Partitioner partitioner_;
  DurationPredictor durationPredictor_;
  Synthesizer synthesizer_;

  // Voice array — dynamically sized to match the voice file.
  // Each row is a style vector for a given input token count.
  std::vector<std::array<float, constants::kVoiceRefSize>> voice_;

  // Streaming state control variables
  std::string inputTextBuffer_;
  mutable std::mutex inputTextBufferMutex_;
  std::atomic<bool> isStreaming_{false};
  std::atomic<bool> stopOnEmptyBuffer_{true};
  int32_t streamSkippedIterations = 0;
};
} // namespace models::text_to_speech::kokoro

REGISTER_CONSTRUCTOR(models::text_to_speech::kokoro::Kokoro, std::string,
                     std::string, std::string, std::string, std::string,
                     std::string, std::string,
                     std::shared_ptr<react::CallInvoker>);

} // namespace rnexecutorch
