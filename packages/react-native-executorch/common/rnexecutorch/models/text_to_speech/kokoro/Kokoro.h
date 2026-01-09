#pragma once

#include <array>
#include <memory>
#include <optional>
#include <string>
#include <vector>

#include "Decoder.h"
#include "DurationPredictor.h"
#include "Encoder.h"
#include "F0NPredictor.h"
#include "Partitioner.h"
#include <phonemis/pipeline.h>
#include <rnexecutorch/metaprogramming/ConstructorHelpers.h>

namespace rnexecutorch {
namespace models::text_to_speech::kokoro {

class Kokoro {
public:
  Kokoro(int language, const std::string &taggerDataSource,
         const std::string &phonemizerDataSource,
         const std::string &durationPredictorSource,
         const std::string &f0nPredictorSource,
         const std::string &encoderSource, const std::string &decoderSource,
         const std::string &voiceSource,
         std::shared_ptr<react::CallInvoker> callInvoker);

  // Processes the entire text at once, before sending back to the JS side.
  std::vector<float> generate(std::string text, float speed = 1.F);

  // Processes text in chunks, sending each chunk individualy to the JS side
  // with asynchronous callbacks.
  void stream(std::string text, float speed,
              std::shared_ptr<jsi::Function> callback);

  std::size_t getMemoryLowerBound() const noexcept;
  void unload() noexcept;

  // Extra options setters
  void setFixedModel(std::string modelLabel);

private:
  // Helper function - loading voice array
  void loadVoice(const std::string &voiceSource);

  // Helper function - selecting the appropriate input config for given input
  // size
  const Configuration &selectConfig(size_t inputSize) const;

  // Helper function - generate specialization for given input size
  std::vector<float> generateForConfig(const std::u32string &phonemes,
                                       const Configuration &config,
                                       float speed);

  // JS callback handle
  std::shared_ptr<react::CallInvoker> callInvoker_;

  // Submodules
  Partitioner partitioner_; // Not a part of the original Kokoro inference
  DurationPredictor durationPredictor_;
  F0NPredictor f0nPredictor_;
  Encoder encoder_;
  Decoder decoder_;

  // Voice array
  // There is a separate voice vector for each of the possible numbers of input
  // tokens.
  std::array<std::array<float, constants::kVoiceRefSize>,
             constants::kInputLarge.noTokens>
      voice_;

  // Phonemizer pipeline
  phonemis::Pipeline phonemizer_;

  // Extra options
  std::optional<std::string> fixedModel_;
};
} // namespace models::text_to_speech::kokoro

REGISTER_CONSTRUCTOR(models::text_to_speech::kokoro::Kokoro, int, std::string,
                     std::string, std::string, std::string, std::string,
                     std::string, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch