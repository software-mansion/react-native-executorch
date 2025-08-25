#include "TokenizerModule.h"
#include <executorch/extension/module/module.h>
#include <filesystem>
#include <rnexecutorch/data_processing/FileUtils.h>

namespace rnexecutorch {
using namespace facebook;

TokenizerModule::TokenizerModule(
    std::string source, std::shared_ptr<react::CallInvoker> callInvoker)
    : memorySizeLowerBound(std::filesystem::file_size(source)),
      tokenizer(tokenizers::Tokenizer::FromBlobJSON(
          file_utils::loadBytesFromFile(source))) {}

void TokenizerModule::ensureTokenizerLoaded(
    const std::string &methodName) const {
  if (!tokenizer) {
    throw std::runtime_error(
        methodName + " function was called on an uninitialized tokenizer!");
  }
}

std::vector<int32_t> TokenizerModule::encode(std::string s) const {
  ensureTokenizerLoaded("encode");
  return tokenizer->Encode(s);
}

std::string TokenizerModule::decode(std::vector<int32_t> vec,
                                    bool skipSpecialTokens) const {
  ensureTokenizerLoaded("decode");
  return tokenizer->Decode(vec, skipSpecialTokens);
}

size_t TokenizerModule::getVocabSize() const {
  ensureTokenizerLoaded("getVocabSize");
  return tokenizer->GetVocabSize();
}

std::string TokenizerModule::idToToken(int32_t tokenId) const {
  ensureTokenizerLoaded("idToToken");
  return tokenizer->IdToToken(tokenId);
}

int32_t TokenizerModule::tokenToId(std::string token) const {
  ensureTokenizerLoaded("tokenToId");
  return tokenizer->TokenToId(token);
}
std::size_t TokenizerModule::getMemoryLowerBound() const noexcept {
  return memorySizeLowerBound;
}

} // namespace rnexecutorch
