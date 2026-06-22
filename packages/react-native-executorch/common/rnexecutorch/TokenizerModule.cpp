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
using namespace executorch::extension::llm;

TokenizerModule::TokenizerModule(
    std::string source, std::shared_ptr<react::CallInvoker> callInvoker)
    : tokenizer(std::make_unique<tokenizers::HFTokenizer>()) {

  auto status = tokenizer->load(source);

  if (status != tokenizers::Error::Ok) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::TokenizerError,
        "Unexpected issue occurred while loading tokenizer");
  };
  std::filesystem::path modelPath{source};
  memorySizeLowerBound = std::filesystem::file_size(modelPath);
}

std::vector<uint64_t> TokenizerModule::encode(std::string s) const {
  if (!tokenizer) {
    THROW_NOT_LOADED_ERROR();
  }

  // If the used tokenizer.json has defined post_processor field,
  // setting any of bos or eos arguments to value other than provided constant
  // ( which is 0) will result in running the post_processor with
  // 'add_special_token' flag
  auto encodeResult =
      tokenizer->encode(s, numOfAddedBoSTokens, numOfAddedEoSTokens);
  if (!encodeResult.ok()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::TokenizerError,
        "Unexpected issue occurred while encoding: " +
            std::to_string(static_cast<int32_t>(encodeResult.error())));
  }
  return encodeResult.get();
}

std::vector<uint64_t>
TokenizerModule::encodeWithSpecialTokens(std::string s) const {
  if (!tokenizer) {
    THROW_NOT_LOADED_ERROR();
  }

  // Passing non-zero bos/eos makes HFTokenizer run the tokenizer.json
  // post_processor with add_special_token=true (the underlying encode treats
  // these as a flag, not a literal count, when a post_processor is defined).
  auto encodeResult = tokenizer->encode(s, /*bos=*/1, /*eos=*/1);
  if (!encodeResult.ok()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::TokenizerError,
        "Unexpected issue occurred while encoding: " +
            std::to_string(static_cast<int32_t>(encodeResult.error())));
  }
  return encodeResult.get();
}

std::string TokenizerModule::decode(std::vector<uint64_t> vec,
                                    bool skipSpecialTokens) const {
  if (!tokenizer) {
    THROW_NOT_LOADED_ERROR();
  }

  auto decodeResult = tokenizer->decode(vec, skipSpecialTokens);
  if (!decodeResult.ok()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::TokenizerError,
        "Unexpected issue occurred while decoding: " +
            std::to_string(static_cast<int32_t>(decodeResult.error())));
  }

  return decodeResult.get();
}

size_t TokenizerModule::getVocabSize() const {
  if (!tokenizer) {
    THROW_NOT_LOADED_ERROR();
  }
  return static_cast<size_t>(tokenizer->vocab_size());
}

std::string TokenizerModule::idToToken(uint64_t tokenId) const {
  if (!tokenizer) {
    THROW_NOT_LOADED_ERROR();
  }
  auto result = tokenizer->id_to_piece(tokenId);
  if (!result.ok()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::TokenizerError,
        "Unexpected issue occurred while converting id to token: " +
            std::to_string(static_cast<int32_t>(result.error())));
  }
  return result.get();
}

uint64_t TokenizerModule::tokenToId(std::string token) const {
  if (!tokenizer) {
    THROW_NOT_LOADED_ERROR();
  }

  auto result = tokenizer->piece_to_id(token);
  if (!result.ok()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::TokenizerError,
        "Unexpected issue occurred while converting token to id: " +
            std::to_string(static_cast<int32_t>(result.error())));
  }
  return result.get();
}

std::size_t TokenizerModule::getMemoryLowerBound() const noexcept {
  return memorySizeLowerBound;
}

} // namespace rnexecutorch
