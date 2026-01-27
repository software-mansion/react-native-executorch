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
    : memorySizeLowerBound(std::filesystem::file_size(source)) {

  auto status = tokenizer.load(file_utils::loadBytesFromFile(source)));

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

std::vector<int32_t> TokenizerModule::encode(std::string s) const {
  ensureTokenizerLoaded("encode");
  return tokenizer->encode(s, 0, 0);
}

std::string TokenizerModule::decode(std::vector<int32_t> vec,
                                    bool skipSpecialTokens) const {
  ensureTokenizerLoaded("decode");

  std::string decoded_text = "";
  uint64_t prev_token = tokenizer->bos_tok();
  for (const auto &current_token : vec) {
    auto decoded_piece =
        tokenizer.decode(prev_token, current_token, skipSpecialTokens);
    ASSERT_EQ(decoded_piece.error(), tokenizers::Error::Ok)
        << "Failed to decode token: " << current_token;
    decoded_text += decoded_piece.get();
    prev_token = current_token;
  }

  return decoded_text;
}

size_t TokenizerModule::getVocabSize() const {
  ensureTokenizerLoaded("getVocabSize");
  return static_cast<size_t>(tokenizer->vocab_size());
}

std::string TokenizerModule::idToToken(int32_t tokenId) const {
  ensureTokenizerLoaded("idToToken");
  auto result = tokenizer->id_to_piece(
      static_cast<uint64_t>(tokenId)); // TODO: Change accepted type to uint64_t
  if (result.ok()) {
    return result.get();
  }
  return "";
}

int32_t TokenizerModule::tokenToId(std::string token) const {
  ensureTokenizerLoaded("tokenToId");
  auto result = tokenizer->piece_to_id(token);
  if (result.ok()) {
    return static_cast<uint32_t>(result.get()); // TODO: CHANGE RETURN TYPE
  }
  return -1;
}

std::size_t TokenizerModule::getMemoryLowerBound() const noexcept {
  return memorySizeLowerBound;
}

} // namespace rnexecutorch
