#include "TokenizerModule.h"
#include "Error.h"
#include "ErrorCodes.h"
#include <cstdint>
#include <executorch/extension/module/module.h>
#include <filesystem>
#include <pytorch/tokenizers/error.h>
#include <rnexecutorch/data_processing/FileUtils.h>

namespace rnexecutorch {
using namespace facebook;

TokenizerModule::TokenizerModule(
    std::string source, std::shared_ptr<react::CallInvoker> callInvoker)
    : tokenizer(std::make_unique<tokenizers::HFTokenizer>()),
      memorySizeLowerBound(std::filesystem::file_size(source)) {

  auto status = tokenizer->load(source);

  if (status != tokenizers::Error::Ok) {
    throw RnExecutorchError(RnExecutorchErrorCode::ModuleNotLoaded,
                            "Unexpected issue when loading tokenizer");
  };
}

void TokenizerModule::ensureTokenizerLoaded(
    const std::string &methodName) const {
  if (!tokenizer) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::ModuleNotLoaded,
        methodName + " function was called on an uninitialized tokenizer!");
  }
}

std::vector<uint64_t> TokenizerModule::encode(std::string s) const {
  ensureTokenizerLoaded("encode");
  // Two last arguments represent number of bos and eos tokens added to the
  // encoded string
  // If the used tokenizer.json has defined post_processor field,
  // setting any of those flags to value other than 0 will result in running the
  // post_processor with 'add_special_token' flag
  return tokenizer->encode(s, 0, 0).get();
}

std::string TokenizerModule::decode(std::vector<uint64_t> vec,
                                    bool skipSpecialTokens) const {
  ensureTokenizerLoaded("decode");

  std::string decoded_text = tokenizer->decode(vec, skipSpecialTokens).get();

  return decoded_text;
}

size_t TokenizerModule::getVocabSize() const {
  ensureTokenizerLoaded("getVocabSize");
  return static_cast<size_t>(tokenizer->vocab_size());
}

std::string TokenizerModule::idToToken(uint64_t tokenId) const {
  ensureTokenizerLoaded("idToToken");
  auto result = tokenizer->id_to_piece(
      static_cast<uint64_t>(tokenId)); // TODO: Change accepted type to uint64_t
  if (result.ok()) {
    return result.get();
  }
  return "";
}

uint64_t TokenizerModule::tokenToId(std::string token) const {
  ensureTokenizerLoaded("tokenToId");
  auto result = tokenizer->piece_to_id(token);
  if (result.ok()) {
    return static_cast<uint64_t>(result.get()); // TODO: CHANGE RETURN TYPE
  }
  return -1;
}

std::size_t TokenizerModule::getMemoryLowerBound() const noexcept {
  return memorySizeLowerBound;
}

} // namespace rnexecutorch
