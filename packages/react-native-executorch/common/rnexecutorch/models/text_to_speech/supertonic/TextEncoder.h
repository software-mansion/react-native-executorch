#pragma once

#include <memory>
#include <span>
#include <string>
#include <vector>

#include <rnexecutorch/models/BaseModel.h>

#include "Types.h"

namespace rnexecutorch::models::text_to_speech::supertonic {

/**
 * Wraps the text_encoder submodule.
 *
 * Encodes token ids together with the text-to-latent style vector into
 * a text embedding. The output is copied to host memory so it remains
 * valid across the vector-estimator flow loop.
 */
class TextEncoder : public BaseModel {
public:
  explicit TextEncoder(const std::string &modelSource,
                       std::shared_ptr<react::CallInvoker> callInvoker);

  /**
   * Produces a text embedding from token ids and style.
   *
   * @param ids       Token ids for the input, shape [tLen].
   * @param mask      Float attention mask, shape [tLen], 1.0 for valid tokens.
   * @param styleTtl  Text-to-latent style vector, flat (kStyleTtlSize).
   * @return          Flat text embedding vector of shape kTextEmbDim × tLen.
   */
  std::vector<float> generate(std::span<Token> ids, std::span<float> mask,
                              std::span<float> styleTtl) const;
};

} // namespace rnexecutorch::models::text_to_speech::supertonic
