#pragma once

#include <array>
#include <memory>
#include <optional>
#include <string>
#include <vector>

#include "DurationPredictor.h"
#include "Partitioner.h"
#include "Synthesizer.h"
#include "Types.h"
#include <phonemis/pipeline.h>
#include <rnexecutorch/metaprogramming/ConstructorHelpers.h>

namespace rnexecutorch {
namespace models::text_to_speech::kokoro {

class Kokoro {
public:
  Kokoro(const std::string &lang, const std::string &taggerDataSource,
         const std::string &phonemizerDataSource,
         const std::string &durationPredictorSource,
         const std::string &synthesizerSource, const std::string &voiceSource,
         std::shared_ptr<react::CallInvoker> callInvoker);

  // Processes the entire text at once, before sending back to the JS side.
  std::vector<float> generate(std::string text, float speed = 1.F);

  // Processes text in chunks, sending each chunk individualy to the JS side
  // with asynchronous callbacks.
  void stream(std::string text, float speed,
              std::shared_ptr<jsi::Function> callback);

  std::size_t getMemoryLowerBound() const noexcept;
  void unload() noexcept;

private:
  // Helper function - loading voice array
  void loadVoice(const std::string &voiceSource);

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

  // Voice array
  // There is a separate voice vector for each of the possible numbers of input
  // tokens.
  std::array<std::array<float, constants::kVoiceRefSize>,
             constants::kMaxInputTokens>
      voice_;
};
} // namespace models::text_to_speech::kokoro

REGISTER_CONSTRUCTOR(models::text_to_speech::kokoro::Kokoro, std::string,
                     std::string, std::string, std::string, std::string,
                     std::string, std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch