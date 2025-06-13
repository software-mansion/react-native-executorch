#include "TokenizerModule.h"
#include <executorch/extension/module/module.h>
#include <fstream>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/FileUtils.h>

namespace rnexecutorch {
using namespace facebook;

TokenizerModule::TokenizerModule(
    std::string source, std::shared_ptr<react::CallInvoker> callInvoker) {
  auto blob = fileutils::loadBytesFromFile(source);
  tokenizer = tokenizers::Tokenizer::FromBlobJSON(blob);
}

std::vector<int32_t> TokenizerModule::encode(std::string s) {
  if (!tokenizer) {
    throw std::runtime_error("Encode called on an uninitialized tokenizer!");
  };
  return tokenizer->Encode(s);
}

std::string TokenizerModule::decode(std::vector<int32_t> vec) {
  if (!tokenizer) {
    throw std::runtime_error("Decode called on an uninitialized tokenizer!");
  }
  return tokenizer->Decode(vec);
}

int TokenizerModule::getMemoryLowerBound() { return 1; }

} // namespace rnexecutorch