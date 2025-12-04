#include "Kokoro.h"

namespace rnexecutorch {
namespace models::text_to_speech::kokoro {

Kokoro::Kokoro(const std::string &durationPredictorSource,
               const std::string &f0nPredictorSource,
               const std::string &encoderSource,
               const std::string &decoderSource,
               std::shared_ptr<react::CallInvoker> callInvoker)
    : duration_predictor_(durationPredictorSource, callInvoker),
      f0n_predictor_(f0nPredictorSource, callInvoker),
      encoder_(encoderSource, callInvoker),
      decoder_(decoderSource, callInvoker) {}

void Kokoro::generate(const std::string &phonemes) {}

void Kokoro::generate(const std::string &phonemes,
                      const Configuration &configuration) {
  // Determine the appropriate method for given input configuration
  std::string method = "forward_" + std::to_string(configuration.noTokens);
}

} // namespace models::text_to_speech::kokoro
} // namespace rnexecutorch
