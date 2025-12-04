#pragma once

#include <string>

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
         std::shared_ptr<react::CallInvoker> callInvoker);

  void generate(const std::string &phonemes);

private:
  // Helper functions - generate specialization for given input size
  void generate(const std::string &phonemes,
                const Configuration &configuration);

  // Kokoro submodules
  DurationPredictor duration_predictor_;
  F0NPredictor f0n_predictor_;
  Encoder encoder_;
  Decoder decoder_;
};

} // namespace models::text_to_speech::kokoro
} // namespace rnexecutorch