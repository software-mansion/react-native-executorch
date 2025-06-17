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
  std::vector<int32_t> encode(std::string s);
  std::string decode(std::vector<int32_t> vec, bool skipSpecialTokens);
  std::string idToToken(int32_t tokenId);
  int32_t tokenToId(std::string token);
  size_t getVocabSize();
  int getMemoryLowerBound();

private:
  std::unique_ptr<tokenizers::Tokenizer> tokenizer;
  std::size_t memorySizeLowerBound{0};
};
} // namespace rnexecutorch