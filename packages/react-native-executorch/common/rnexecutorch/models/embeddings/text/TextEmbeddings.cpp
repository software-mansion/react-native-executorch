#include "TextEmbeddings.h"
#include <executorch/extension/tensor/tensor_ptr_maker.h>
#include <rnexecutorch/data_processing/Numerical.h>
#include <rnexecutorch/Log.h>

namespace rnexecutorch::models::embeddings {

using namespace executorch::extension;

TextEmbeddings::TextEmbeddings(const std::string &modelSource,
                               const std::string &tokenizerSource,
                               std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseEmbeddings(modelSource, callInvoker),
      tokenizer(
          std::make_unique<TokenizerModule>(tokenizerSource, callInvoker)) {}

TokenIdsWithAttentionMask TextEmbeddings::preprocess(const std::string &input) {
  auto inputIds = tokenizer->encode(input);
  log(LOG_LEVEL::Info, "Tokens ", inputIds.size(), inputIds[0], inputIds[1], inputIds[2]);
  // Tokenizers-cpp return tokens as int32, but text embedding models require
  // int64 as input
  std::vector<int64_t> inputIds64;
  inputIds64.reserve(inputIds.size());
  for (const auto &tok : inputIds) {
    inputIds64.push_back(static_cast<int64_t>(tok));
  }
  log(LOG_LEVEL::Info, "Tokens64 ", inputIds64.size(), inputIds64[0], inputIds64[1], inputIds64[2]);

  std::vector<int64_t> attentionMask;
  attentionMask.reserve(inputIds.size());
  for (const auto &tok : inputIds64) {
    // Distinguishing between real tokens and padding, 0 is for paddings, while
    // any other tokens are relevant
    attentionMask.push_back(tok != 0);
  }
  return {.inputIds = inputIds64, .attentionMask = attentionMask};
}

std::shared_ptr<OwningArrayBuffer>
TextEmbeddings::generate(const std::string input) {
  auto preprocessed = preprocess(input);

  std::vector<int32_t> tokenIdsShape = {
      1, static_cast<int32_t>(preprocessed.inputIds.size())};
  std::vector<int32_t> attnMaskShape = {
      1, static_cast<int32_t>(preprocessed.attentionMask.size())};

  auto tokenIds = make_tensor_ptr(tokenIdsShape, preprocessed.inputIds.data(),
                                  ScalarType::Long);
  auto attnMask = make_tensor_ptr(
      attnMaskShape, preprocessed.attentionMask.data(), ScalarType::Long);

  auto forwardResult = BaseModel::forward({tokenIds, attnMask});
  // log(LOG_LEVEL::Info, "Embedding ", forwardResult.size(), forwardResult[0], forwardResult[1], forwardResult[2]);
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Function forward in TextEmbeddings failed with error code: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }

  return BaseEmbeddings::postprocess(forwardResult);
}

} // namespace rnexecutorch::models::embeddings
