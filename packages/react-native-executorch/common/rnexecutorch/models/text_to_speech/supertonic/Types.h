#pragma once

#include <array>
#include <cstddef>
#include <cstdint>
#include <vector>

#include "Constants.h"

namespace rnexecutorch::models::text_to_speech::supertonic {

// Model input token type (unicode-indexer id).
using Token = int64_t;

/**
 * A Supertonic voice.
 *
 * Two style vectors drive the two conditioning paths of the model:
 *   - ttl: text-to-latent style, shape [n_style(50) x style_dim(256)]
 *   - dp:  duration-predictor style, shape [dp_style_tokens(8) x
 * dp_style_dim(16)]
 *
 * Stored on disk (and downloaded from HF) as a flat little-endian float32 blob:
 * the 12800 ttl values followed by the 128 dp values (see
 * scripts/convert_voice.py).
 */
struct Voice {
  std::array<float, constants::kStyleTtlSize> ttl{};
  std::array<float, constants::kStyleDpSize> dp{};
};

/**
 * Result of preprocessing + tokenizing one text chunk.
 *
 * ``ids`` are the unicode-indexer token ids (already language-token wrapped);
 * ``mask`` is the all-ones float attention mask of the same length. They are
 * kept as owning vectors because the ExecuTorch tensors borrow their storage
 * for the duration of a forward call.
 */
struct TokenizedText {
  std::vector<Token> ids;
  std::vector<float> mask;
};

} // namespace rnexecutorch::models::text_to_speech::supertonic
