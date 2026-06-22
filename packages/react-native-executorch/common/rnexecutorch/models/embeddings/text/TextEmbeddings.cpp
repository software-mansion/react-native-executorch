#include "TextEmbeddings.h"
#include <executorch/extension/tensor/tensor_ptr_maker.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/data_processing/Numerical.h>

namespace rnexecutorch::models::embeddings {

using namespace executorch::extension;

TextEmbeddings::TextEmbeddings(const std::string &modelSource,
                               const std::string &tokenizerSource,
                               std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker),
      tokenizer(
          std::make_unique<TokenizerModule>(tokenizerSource, callInvoker)) {}

TokenIdsWithAttentionMask TextEmbeddings::preprocess(const std::string &input) {
  // Apply the tokenizer's post_processor so declared special tokens (e.g. a
  // BOS prepended via TemplateProcessing) are added. CLS-pooled embedding
  // models read position 0, so a missing BOS corrupts the pooled vector.
  auto inputIds = tokenizer->encodeWithSpecialTokens(input);
  // Tokenizers-cpp return tokens as int32, but text embedding models require
  // int64 as input
  std::vector<int64_t> inputIds64;
  inputIds64.reserve(inputIds.size());
  for (const auto &tok : inputIds) {
    inputIds64.push_back(static_cast<int64_t>(tok));
  }

  std::vector<int64_t> attentionMask;
  attentionMask.reserve(inputIds.size());
  for (const auto &tok : inputIds64) {
    // Distinguishing between real tokens and padding, 0 is for paddings, while
    // any other tokens are relevant
    attentionMask.push_back(tok != 0);
  }
  return {.inputIds = inputIds64, .attentionMask = attentionMask};
}

void TextEmbeddings::unload() noexcept {
  std::scoped_lock lock(inference_mutex_);
  BaseModel::unload();
}

EmbeddingResult TextEmbeddings::generate(const std::string input) {
  std::scoped_lock lock(inference_mutex_);
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
  CHECK_OK_OR_THROW_FORWARD_ERROR(forwardResult);

  return buildResult(forwardResult->at(0).toTensor(),
                     std::move(preprocessed.inputIds));
}

// Output is [1, numTokens, embeddingDim] (numTokens == 1 for pooled models,
// == sequence length for multi-vector models). Multi-vector consumers index
// tokenIds[i] per output row (e.g. skiplist masking), so numTokens must match
// the input token count or that alignment silently breaks.
EmbeddingResult
TextEmbeddings::buildResult(const executorch::aten::Tensor &output,
                            std::vector<int64_t> tokenIds) {
  auto sizes = output.sizes();
  if (sizes.size() < 2) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidModelOutput,
                            "Embedding output must be at least 2D, got rank " +
                                std::to_string(sizes.size()));
  }

  const auto numTokens = static_cast<int32_t>(sizes[sizes.size() - 2]);
  const auto inputTokens = static_cast<int32_t>(tokenIds.size());
  if (numTokens != 1 && numTokens != inputTokens) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidModelOutput,
        "Embedding output rows (" + std::to_string(numTokens) +
            ") != input tokens (" + std::to_string(inputTokens) +
            "); per-token tokenIds alignment is broken.");
  }

  return EmbeddingResult{
      .dataPtr = std::make_shared<OwningArrayBuffer>(output.const_data_ptr(),
                                                     output.nbytes()),
      .numTokens = numTokens,
      .embeddingDim = static_cast<int32_t>(sizes[sizes.size() - 1]),
      .tokenIds = std::move(tokenIds),
  };
}

} // namespace rnexecutorch::models::embeddings
