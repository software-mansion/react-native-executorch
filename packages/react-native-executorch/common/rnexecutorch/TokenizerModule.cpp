#include "TokenizerModule.h"
#include <executorch/extension/module/module.h>
#include <filesystem>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/FileUtils.h>

namespace rnexecutorch {
using namespace facebook;

TokenizerModule::TokenizerModule(
    std::string source, std::shared_ptr<react::CallInvoker> callInvoker) {
  auto blob = fileutils::loadBytesFromFile(source);
  memorySizeLowerBound = std::filesystem::file_size(source);
  tokenizer = tokenizers::Tokenizer::FromBlobJSON(blob);
}

std::vector<int32_t> TokenizerModule::encode(std::string s) {
  if (!tokenizer) {
    throw std::runtime_error("Encode called on an uninitialized tokenizer!");
  };
  return tokenizer->Encode(s);
}

std::string TokenizerModule::decode(std::vector<int32_t> vec,
                                    bool skipSpecialTokens) {
  if (!tokenizer) {
    throw std::runtime_error("Decode called on an uninitialized tokenizer!");
  }
  return tokenizer->Decode(vec, skipSpecialTokens);
}

size_t TokenizerModule::getVocabSize() {
  if (!tokenizer) {
    throw std::runtime_error(
        "getVocabSize called on an uninitialized tokenizer!");
  }
  return tokenizer->GetVocabSize();
}

std::string TokenizerModule::idToToken(int32_t tokenId) {
  if (!tokenizer) {
    throw std::runtime_error("idToToken called on an uninitialized tokenizer!");
  }
  return tokenizer->IdToToken(tokenId);
}

int32_t TokenizerModule::tokenToId(std::string token) {
  if (!tokenizer) {
    throw std::runtime_error("tokenToId called on an uninitialized tokenizer!");
  }
  return tokenizer->TokenToId(token);
}
int TokenizerModule::getMemoryLowerBound() { return memorySizeLowerBound; }
} // namespace rnexecutorch