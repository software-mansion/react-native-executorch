#pragma once

#include <cstddef>
#include <cstdint>

namespace rnexecutorch::models::text_to_speech::kokoro {

// Type definitions - model input tokens
using Token = int64_t;

/**
 * Type definition - model shared context
 *
 * Defines values shared between Kokoro submodules.
 */
struct Context {
  size_t inputTokensLimit = 0;
  size_t inputDurationLimit = 0;
};

/**
 * Type definition - token timestamp.
 *
 * Values correspond to the amount of waveform samples.
 */
struct Timestamp {
  size_t begin = 0;
  size_t end = 0;
};

} // namespace rnexecutorch::models::text_to_speech::kokoro
