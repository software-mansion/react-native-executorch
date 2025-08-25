#pragma once

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <ReactCommon/CallInvoker.h>
#include <string>
#include <tokenizers-cpp/tokenizers_cpp.h>
namespace rnexecutorch {
using namespace facebook;

class TokenizerModule {
public:
  explicit TokenizerModule(std::string source,
                           std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<int32_t> encode(std::string s) const;
  std::string decode(std::vector<int32_t> vec, bool skipSpecialTokens) const;
  std::string idToToken(int32_t tokenId) const;
  int32_t tokenToId(std::string token) const;
  std::size_t getVocabSize() const;
  std::size_t getMemoryLowerBound() const noexcept;

private:
  void ensureTokenizerLoaded(const std::string &methodName) const;
  std::unique_ptr<tokenizers::Tokenizer> tokenizer;
  const std::size_t memorySizeLowerBound{0};
};

REGISTER_CONSTRUCTOR(TokenizerModule, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch