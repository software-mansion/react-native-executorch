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

std::vector<int32_t> TokenizerModule::encode(const std::string s) {
  if (!tokenizer) {
    throw std::runtime_error("Encode called on an uninitialized tokenizer!");
  };
  return tokenizer->Encode(s);
}

std::string TokenizerModule::decode(const std::vector<int32_t> vec) {
  if (!tokenizer) {
    throw std::runtime_error("Decode called on an uninitialized tokenizer!");
  }
  return tokenizer->Decode(vec);
}

int TokenizerModule::getMemoryLowerBound() { return memorySizeLowerBound; }
} // namespace rnexecutorch