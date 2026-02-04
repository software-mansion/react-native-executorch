#include "TokenizerModule.h"
#include "Error.h"
#include "ErrorCodes.h"
#include <cstdint>
#include <executorch/extension/module/module.h>
#include <filesystem>
#include <pytorch/tokenizers/error.h>
#include <runner/constants.h>

namespace rnexecutorch {
using namespace facebook;
using namespace executorch::extension::constants;

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

  // If the used tokenizer.json has defined post_processor field,
  // setting any of bos or eos arguments to value other than provided constant
  // ( which is 0) will result in running the post_processor with
  // 'add_special_token' flag
  auto encodeResult =
      tokenizer->encode(s, numOfAddedBoSTokens, numOfAddedEoSTokens);
  if (!encodeResult.ok()) {
    throw rnexecutorch::RnExecutorchError(
        rnexecutorch::RnExecutorchErrorCode::TokenizerError,
        "Unexpected issue occured while encoding: " +
            std::to_string(static_cast<int32_t>(encodeResult.error())));
  }
  return encodeResult.get();
}

std::string TokenizerModule::decode(std::vector<uint64_t> vec,
                                    bool skipSpecialTokens) const {
  ensureTokenizerLoaded("decode");

  auto decodeResult = tokenizer->decode(vec, skipSpecialTokens);
  if (!decodeResult.ok()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::TokenizerError,
        "Unexpected issue occured while decoding: " +
            std::to_string(static_cast<int32_t>(decodeResult.error())));
  }

  return decodeResult.get();
}

size_t TokenizerModule::getVocabSize() const {
  ensureTokenizerLoaded("getVocabSize");
  return static_cast<size_t>(tokenizer->vocab_size());
}

std::string TokenizerModule::idToToken(uint64_t tokenId) const {
  ensureTokenizerLoaded("idToToken");
  auto result = tokenizer->id_to_piece(tokenId);
  if (!result.ok()) {
    throw rnexecutorch::RnExecutorchError(
        rnexecutorch::RnExecutorchErrorCode::TokenizerError,
        "Unexpected issue occured while trying to convert id to token: " +
            std::to_string(static_cast<int32_t>(result.error())));
  }
  return result.get();
}

uint64_t TokenizerModule::tokenToId(std::string token) const {
  ensureTokenizerLoaded("tokenToId");

  auto result = tokenizer->piece_to_id(token);
  if (!result.ok()) {
    throw rnexecutorch::RnExecutorchError(
        rnexecutorch::RnExecutorchErrorCode::TokenizerError,
        "Unexpected issue occured while trying to convert token to id: " +
            std::to_string(static_cast<int32_t>(result.error())));
  }
  return result.get();
}

std::size_t TokenizerModule::getMemoryLowerBound() const noexcept {
  return memorySizeLowerBound;
}

} // namespace rnexecutorch
