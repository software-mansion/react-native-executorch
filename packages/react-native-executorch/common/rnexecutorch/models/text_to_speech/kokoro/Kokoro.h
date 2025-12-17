#pragma once

#include <array>
#include <string>
#include <vector>

#include "Decoder.h"
#include "DurationPredictor.h"
#include "Encoder.h"
#include "F0NPredictor.h"
#include <phonemis/pipeline.h>
#include <rnexecutorch/metaprogramming/ConstructorHelpers.h>

namespace rnexecutorch {
namespace models::text_to_speech::kokoro {

class Kokoro {
public:
  Kokoro(const std::string &taggerDataSource,
         const std::string &phonemizerDataSource,
         const std::string &durationPredictorSource,
         const std::string &f0nPredictorSource,
         const std::string &encoderSource, const std::string &decoderSource,
         const std::string &voiceSource,
         std::shared_ptr<react::CallInvoker> callInvoker);

  std::vector<float> generate(std::string text, float speed = 1.F);

  std::size_t getMemoryLowerBound() const noexcept;
  void unload() noexcept;

private:
  // Helper function - loading voice array
  void loadSingleVoice(const std::string &voiceSource);

  // Helper function - generate specialization for given input size
  std::vector<float> generateForConfig(const std::u32string &phonemes,
                                       const Configuration &config,
                                       float speed = 1.F);

  // Helper function - phonemes to tokens mapping
  std::vector<Token> toTokens(const std::u32string &phonemes,
                              const Configuration &config) const;

  // Kokoro submodules
  DurationPredictor durationPredictor_;
  F0NPredictor f0nPredictor_;
  Encoder encoder_;
  Decoder decoder_;

  // Voice array
  // There is a separate voice vector for each of the possible numbers of input
  // tokens.
  std::array<std::array<float, constants::kVoiceRefSize>,
             constants::kLargeInput.noTokens>
      voice_;

  // Phonemizer pipeline
  phonemis::Pipeline phonemizer_;
};
} // namespace models::text_to_speech::kokoro

REGISTER_CONSTRUCTOR(models::text_to_speech::kokoro::Kokoro, std::string,
                     std::string, std::string, std::string, std::string,
                     std::string, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch