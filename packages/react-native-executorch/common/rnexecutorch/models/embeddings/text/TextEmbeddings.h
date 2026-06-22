#pragma once

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <mutex>
#include <rnexecutorch/TokenizerModule.h>
#include <rnexecutorch/models/BaseModel.h>
#include <rnexecutorch/models/embeddings/Types.h>

namespace rnexecutorch {
namespace models::embeddings {

struct TokenIdsWithAttentionMask {
  std::vector<int64_t> inputIds;
  std::vector<int64_t> attentionMask;
};

class TextEmbeddings final : public BaseModel {
public:
  TextEmbeddings(const std::string &modelSource,
                 const std::string &tokenizerSource,
                 std::shared_ptr<react::CallInvoker> callInvoker);
  // Returns the raw [numTokens, embeddingDim] output. Pooled models give
  // numTokens == 1; multi-vector (late-interaction) models give the full
  // sequence. The TS layer reduces to a single vector or keeps the matrix
  // based on the model's config.
  [[nodiscard("Registered non-void function")]] EmbeddingResult
  generate(const std::string input);
  void unload() noexcept;

private:
  mutable std::mutex inference_mutex_;
  std::vector<std::vector<int32_t>> inputShapes;
  TokenIdsWithAttentionMask preprocess(const std::string &input);
  std::unique_ptr<TokenizerModule> tokenizer;
};
} // namespace models::embeddings

REGISTER_CONSTRUCTOR(models::embeddings::TextEmbeddings, std::string,
                     std::string, std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
