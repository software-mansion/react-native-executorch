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
   * Processes the entire text at once, before sending back to the JS side.
   */
  std::vector<float> generate(std::string text, float speed = 1.F);

  /**
   * Processes text from inputTextBuffer_ in chunks, sending each chunk
   * individualy to the JS side with asynchronous callbacks.
   *
   * Allows an incrementally expanded input by using an input text buffer.
   */
  void stream(float speed, bool stopOnEmptyBuffer,
              std::shared_ptr<jsi::Function> callback);

  /**
   * Updates the input streaming buffer by adding more text to be processed.
   *
   * @param text A new chunk of text, appended to the end of the input buffer.
   */
  void streamInsert(std::string textChunk) noexcept;

  /**
   * Stops the streaming process.
   *
   * @param instant If true, stops the streaming as soon as possible by
   * switching the isStreaming_ flag. Otherwise allows to process the rest of
   * the buffer first, by switching the stopOnEmptyBuffer_ flag.
   */
  void streamStop(bool instant) noexcept;

  std::size_t getMemoryLowerBound() const noexcept;
  void unload() noexcept;

private:
  // Helper function - loading voice array
  void loadVoice(const std::string &voiceSource);

  // Helper function - shared synthesis pipeline (partition + synthesize)
  std::vector<float> generateFromPhonemesImpl(const std::u32string &phonemes,
                                              float speed);
  void streamFromPhonemesImpl(const std::u32string &phonemes, float speed,
                              std::shared_ptr<jsi::Function> callback);

  // Helper function - generate specialization for given input size
  std::vector<float> synthesize(const std::u32string &phonemes, float speed,
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
