#pragma once

#include <cstddef>
#include <cstdint>
#include <string>
#include <unordered_set>

namespace rnexecutorch::models::text_to_speech::supertonic::constants {

// --- Audio ----------------------------------------------------------------
inline constexpr int32_t kSamplingRate = 44100; // ae.sample_rate
inline constexpr int32_t kSamplesPerMillisecond = kSamplingRate / 1000;

// --- Latent geometry (from tts.json) --------------------------------------
inline constexpr int32_t kBaseChunkSize = 512;     // ae.base_chunk_size
inline constexpr int32_t kChunkCompressFactor = 6; // ttl.chunk_compress_factor
inline constexpr int32_t kLatentDim = 24;          // ttl.latent_dim
inline constexpr int32_t kSamplesPerLatentFrame =
    kBaseChunkSize * kChunkCompressFactor; // 3072
inline constexpr int32_t kLatentChannels =
    kLatentDim * kChunkCompressFactor; // 144

// --- Style vectors --------------------------------------------------------
inline constexpr int32_t kStyleTtlTokens = 50;
inline constexpr int32_t kStyleTtlDim = 256;
inline constexpr int32_t kStyleTtlSize =
    kStyleTtlTokens * kStyleTtlDim; // 12800
inline constexpr int32_t kStyleDpTokens = 8;
inline constexpr int32_t kStyleDpDim = 16;
inline constexpr int32_t kStyleDpSize = kStyleDpTokens * kStyleDpDim; // 128

// Channel dim of the text embedding produced by the text encoder.
inline constexpr int32_t kTextEmbDim = 256;

// --- Inference defaults / limits ------------------------------------------
inline constexpr int32_t kDefaultTotalSteps = 8;
inline constexpr int32_t kMinTotalSteps = 1;
inline constexpr int32_t kMaxTotalSteps = 32;
inline constexpr float kDefaultSpeed = 1.05F;
inline constexpr float kMinValidSpeed = 0.7F;
inline constexpr float kMaxValidSpeed = 2.0F;

// The rotary-position buffer inside vector_estimator caps the latent length
// (≈ kMaxLatentFrames * kSamplesPerLatentFrame / kSamplingRate seconds).
inline constexpr size_t kMaxLatentFrames = 1000;

// Text-length bounds of the exported (dynamic-shape) models. Inputs are padded
// up to kMinTokens or truncated down to kMaxTokens to stay within the range the
// .pte files were exported for (see scripts/export/export_xnnpack.py).
inline constexpr size_t kMinTokens = 8;
inline constexpr size_t kMaxTokens = 256;
inline constexpr int64_t kPadToken =
    0; // valid embedding row; masked out anyway

// Unicode indexer: fixed BMP-sized table; entry == -1 means unsupported.
inline constexpr size_t kIndexerSize = 65536;
inline constexpr int64_t kUnsupportedIndex = -1;

} // namespace rnexecutorch::models::text_to_speech::supertonic::constants
