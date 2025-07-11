#include "TextEmbeddings.h"
#include <executorch/extension/tensor/tensor_ptr_maker.h>
#include <rnexecutorch/data_processing/Numerical.h>

namespace rnexecutorch {

using namespace executorch::extension;

TextEmbeddings::TextEmbeddings(const std::string &modelSource,
                               const std::string &tokenizerSource,
                               std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker),
      tokenizer(
          std::make_unique<TokenizerModule>(tokenizerSource, callInvoker)) {}

TokenIdsWithAttentionMask TextEmbeddings::preprocess(const std::string &input) {
  auto inputIds = tokenizer->encode(input);
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
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Failed to forward, error: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }

  auto forwardResultTensor = forwardResult->at(0).toTensor();
  auto dataPtr = forwardResultTensor.mutable_data_ptr();
  auto outputNumel = forwardResultTensor.numel();

  std::span<float> modelOutputSpan(static_cast<float *>(dataPtr), outputNumel);
  std::span<const int64_t> attnMaskSpan(preprocessed.attentionMask.data(),
                                        preprocessed.attentionMask.size());

  return postprocess(modelOutputSpan, attnMaskSpan);
}

std::shared_ptr<OwningArrayBuffer>
TextEmbeddings::postprocess(std::span<float> modelOutput,
                            std::span<const int64_t> attnMask) {
  auto createBuffer = [](const auto &data, size_t size) {
    auto buffer = std::make_shared<OwningArrayBuffer>(size);
    std::memcpy(buffer->data(), data, size);
    return buffer;
  };

  return createBuffer(modelOutput.data(), modelOutput.size_bytes());
}

} // namespace rnexecutorch