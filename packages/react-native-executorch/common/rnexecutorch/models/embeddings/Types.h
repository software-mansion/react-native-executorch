#pragma once

#include <cstdint>
#include <memory>
#include <rnexecutorch/jsi/OwningArrayBuffer.h>
#include <vector>

namespace rnexecutorch::models::embeddings {

// Text embedding output as a [numTokens, embeddingDim] fp32 matrix. Pooled
// single-vector models output numTokens == 1 (the exported graph pools + L2-
// normalizes); multi-vector (late-interaction / ColBERT) models output
// numTokens == sequence length. The TS layer reduces to a single vector or
// keeps the per-token matrix based on the model's config. `tokenIds` are the
// input ids (used JS-side for late-interaction skiplist masking).
struct EmbeddingResult {
  std::shared_ptr<OwningArrayBuffer> dataPtr;
  int32_t numTokens;
  int32_t embeddingDim;
  std::vector<int64_t> tokenIds;
};

} // namespace rnexecutorch::models::embeddings
