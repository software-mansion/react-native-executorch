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
    : BaseEmbeddings(modelSource, callInvoker),
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

  // Output is [1, numTokens, embeddingDim] (numTokens == 1 for pooled models,
  // == sequence length for multi-vector models). Return the raw matrix + the
  // input ids; the TS layer reduces to a single vector or keeps the matrix.
  auto out = forwardResult->at(0).toTensor();
  auto sizes = out.sizes();

  EmbeddingResult result;
  result.dataPtr = std::make_shared<OwningArrayBuffer>(out.const_data_ptr(),
                                                       out.nbytes());
  result.numTokens = static_cast<int32_t>(sizes[sizes.size() - 2]);
  result.embeddingDim = static_cast<int32_t>(sizes[sizes.size() - 1]);
  result.tokenIds = std::move(preprocessed.inputIds);

  // Invariant for multi-vector models: one output row per input token, so
  // numTokens (from the output tensor) must equal tokenIds.size() (from the
  // input). Consumers index tokenIds[i] per output row (e.g. skiplist masking),
  // which silently breaks if the graph ever pads/truncates the sequence.
  // (Pooled models legitimately collapse to numTokens == 1.)
  if (result.numTokens != 1 &&
      result.numTokens != static_cast<int32_t>(result.tokenIds.size())) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidModelOutput,
        "Embedding output rows (" + std::to_string(result.numTokens) +
            ") != input tokens (" +
            std::to_string(result.tokenIds.size()) +
            "); per-token tokenIds alignment is broken.");
  }
  return result;
}

} // namespace rnexecutorch::models::embeddings
