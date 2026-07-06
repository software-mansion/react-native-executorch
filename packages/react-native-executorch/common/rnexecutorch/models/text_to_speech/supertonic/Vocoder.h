#pragma once

#include <memory>
#include <span>
#include <string>
#include <vector>

#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch::models::text_to_speech::supertonic {

/**
 * Wraps the vocoder submodule.
 *
 * Decodes the final latent vector produced by VectorEstimator into
 * a raw PCM waveform.
 */
class Vocoder : public BaseModel {
public:
  Vocoder(const std::string &modelSource,
          std::shared_ptr<react::CallInvoker> callInvoker);

  /**
   * Decodes a latent vector into a waveform.
   *
   * @param xt        Final latent vector from VectorEstimator, flat (channels ×
   * L).
   * @param channels  Number of latent channels (kLatentChannels).
   * @param L         Number of latent frames.
   * @return          Raw PCM waveform samples.
   */
  std::vector<float> generate(std::span<float> xt, int32_t channels,
                              int32_t L) const;
};

} // namespace rnexecutorch::models::text_to_speech::supertonic