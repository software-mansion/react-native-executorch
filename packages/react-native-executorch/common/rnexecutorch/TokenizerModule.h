#pragma once

#include <ReactCommon/CallInvoker.h>
#include <string>
#include <tokenizers-cpp/tokenizers_cpp.h>

namespace rnexecutorch {
using namespace facebook;

class TokenizerModule {
public:
  TokenizerModule(std::string source,
                  std::shared_ptr<react::CallInvoker> callInvoker);
  std::vector<int32_t> encode(std::string s) const;
  std::string decode(std::vector<int32_t> vec, bool skipSpecialTokens) const;
  std::string idToToken(int32_t tokenId) const;
  int32_t tokenToId(std::string token) const;
  std::size_t getVocabSize() const;
  std::size_t getMemoryLowerBound() const noexcept;

private:
  void ensureTokenizerLoaded() const;
  std::unique_ptr<tokenizers::Tokenizer> tokenizer;
  std::size_t memorySizeLowerBound{0};
};
} // namespace rnexecutorch