#pragma once

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/TokenizerModule.h>
#include <rnexecutorch/models/embeddings/BaseEmbeddings.h>

namespace rnexecutorch {
namespace models::embeddings {

struct TokenIdsWithAttentionMask {
  std::vector<int64_t> inputIds;
  std::vector<int64_t> attentionMask;
};

class TextEmbeddings final : public BaseEmbeddings {
public:
  TextEmbeddings(const std::string &modelSource,
                 const std::string &tokenizerSource,
                 std::shared_ptr<react::CallInvoker> callInvoker);
  std::shared_ptr<OwningArrayBuffer> generate(const std::string input);

private:
  std::vector<std::vector<int32_t>> inputShapes;
  TokenIdsWithAttentionMask preprocess(const std::string &input);
  std::unique_ptr<TokenizerModule> tokenizer;
};
} // namespace models::embeddings

REGISTER_CONSTRUCTOR(models::embeddings::TextEmbeddings, std::string,
                     std::string, std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
