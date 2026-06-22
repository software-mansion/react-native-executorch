#pragma once

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <ReactCommon/CallInvoker.h>
#include <pytorch/tokenizers/hf_tokenizer.h>
#include <string>
namespace rnexecutorch {
using namespace facebook;

class TokenizerModule {
public:
  explicit TokenizerModule(std::string source,
                           std::shared_ptr<react::CallInvoker> callInvoker);
  [[nodiscard("Registered non-void function")]] std::vector<uint64_t>
  encode(std::string s) const;
  // Like encode, but applies the tokenizer.json post_processor (e.g.
  // TemplateProcessing that prepends BOS). Needed by models whose pooling
  // depends on the BOS/CLS token (e.g. CLS-pooled text embeddings). Not JS-
  // bound; encode() keeps its single-arg signature for the JS API.
  [[nodiscard("Registered non-void function")]] std::vector<uint64_t>
  encodeWithSpecialTokens(std::string s) const;
  [[nodiscard("Registered non-void function")]] std::string
  decode(std::vector<uint64_t> vec, bool skipSpecialTokens) const;
  [[nodiscard("Registered non-void function")]] std::string
  idToToken(uint64_t tokenId) const;
  [[nodiscard("Registered non-void function")]] uint64_t
  tokenToId(std::string token) const;
  [[nodiscard("Registered non-void function")]] std::size_t
  getVocabSize() const;
  std::size_t getMemoryLowerBound() const noexcept;

private:
  // Shared encode implementation. bos/eos act as an add-special-tokens flag
  // (not a literal count) when the tokenizer.json defines a post_processor.
  std::vector<uint64_t> encodeImpl(const std::string &s, int8_t bos,
                                   int8_t eos) const;

  std::unique_ptr<tokenizers::HFTokenizer> tokenizer;
  std::size_t memorySizeLowerBound{0};
};

REGISTER_CONSTRUCTOR(TokenizerModule, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
