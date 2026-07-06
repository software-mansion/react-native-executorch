#pragma once

#include <cstdint>
#include <memory>
#include <random>
#include <span>
#include <string>
#include <vector>

#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch::models::text_to_speech::supertonic {

/**
 * Wraps the vector_estimator submodule.
 *
 * Encapsulates the full flow-matching pipeline: computes latent frame
 * geometry from the predicted duration, samples masked Gaussian latent
 * noise, and iteratively refines it through an Euler integration loop.
 */
class VectorEstimator : public BaseModel {
public:
  struct Result {
    std::vector<float> xt; // Final latent vector, flat (channels × L).
    int32_t L;             // Number of latent frames.
  };

  VectorEstimator(const std::string &modelSource,
                  std::shared_ptr<react::CallInvoker> callInvoker);

  /**
   * Computes latent frame geometry from the predicted duration, samples
   * masked Gaussian noise, and runs the flow-matching Euler loop.
   *
   * @param textEmb     Flat text embedding from TextEncoder.
   * @param textEmbLen  Number of tokens (T axis) in the text embedding.
   * @param styleTtl    Text-to-latent style vector, flat (kStyleTtlSize).
   * @param mask        Float attention mask, shape [tLen].
   * @param tLen        Number of input tokens.
   * @param durationSec Predicted utterance duration in seconds (from
   * DurationPredictor).
   * @param totalSteps  Number of flow-matching Euler steps.
   * @return            Result with the final latent xt and the number of latent
   * frames L.
   */
  Result generate(std::span<float> textEmb, int32_t textEmbLen,
                  std::span<float> styleTtl, std::span<float> mask,
                  int32_t tLen, float durationSec, int32_t totalSteps) const;

private:
  mutable std::mt19937 rng_{std::random_device{}()};
};

} // namespace rnexecutorch::models::text_to_speech::supertonic