#pragma once

#include <rnexecutorch/TokenizerModule.h>
#include <rnexecutorch/models/BaseModel.h>
#include <span>

namespace rnexecutorch {

struct TokenIdsWithAttentionMask {
  std::vector<int64_t> inputIds;
  std::vector<int64_t> attentionMask;
};

class TextEmbeddings : public BaseModel {
public:
  TextEmbeddings(const std::string &modelSource,
                 const std::string &tokenizerSource,
                 std::shared_ptr<react::CallInvoker> callInvoker);
  std::shared_ptr<OwningArrayBuffer> generate(const std::string input);

private:
  std::vector<std::vector<int32_t>> inputShapes;
  TokenIdsWithAttentionMask preprocess(const std::string &input);
  std::shared_ptr<OwningArrayBuffer> postprocess(std::span<float> modelOutput);
  std::unique_ptr<TokenizerModule> tokenizer;
};
}; // namespace rnexecutorch
