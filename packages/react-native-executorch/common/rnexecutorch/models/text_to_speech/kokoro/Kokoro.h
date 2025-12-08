#pragma once

#include <array>
#include <string>
#include <vector>

#include "Decoder.h"
#include "DurationPredictor.h"
#include "Encoder.h"
#include "F0NPredictor.h"

namespace rnexecutorch {
namespace models::text_to_speech::kokoro {

class Kokoro {
public:
  Kokoro(const std::string &durationPredictorSource,
         const std::string &f0nPredictorSource,
         const std::string &encoderSource, const std::string &decoderSource,
         const std::string &voiceSource,
         std::shared_ptr<react::CallInvoker> callInvoker);

  std::vector<float> generate(const std::u32string &phonemes, float speed = 1.F);

private:
  // Helper functions - loading voice array
  void loadSingleVoice(const std::string &voiceSource);

  // Helper functions - generate specialization for given input size
  std::vector<float> generate(const std::u32string &phonemes,
                              const Configuration &configuration, float speed = 1.F);

  // Helper functions - phonemes to tokens mapping
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
};

} // namespace models::text_to_speech::kokoro
} // namespace rnexecutorch