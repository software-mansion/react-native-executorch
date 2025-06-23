#include "TextEmbeddings.h"
#include <executorch/extension/tensor/tensor_ptr_maker.h>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/Numerical.h>
#include <span>

namespace rnexecutorch {

using namespace executorch::extension;

TextEmbeddings::TextEmbeddings(const std::string &modelSource,
                               const std::string &tokenizerSource,
                               std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker),
      tokenizer(
          std::make_unique<TokenizerModule>(tokenizerSource, callInvoker)),
      inputShapes(getAllInputShapes()) {}

std::pair<std::vector<int64_t>, std::vector<int64_t>>
TextEmbeddings::preprocess(const std::string &input) {
  auto inputIds = tokenizer->encode(input);
  std::vector<int64_t> attentionMask;
  attentionMask.reserve(inputIds.size());

  // Convert int32_t to int64_t
  std::vector<int64_t> inputIds64;
  inputIds64.reserve(inputIds.size());
  for (const auto &tok : inputIds) {
    inputIds64.push_back(static_cast<int64_t>(tok));
  }

  for (const auto &tok : inputIds64) {
    // Distinguishing between real tokens and padding, 0 is for paddings, while
    // any other tokens are relevant
    attentionMask.push_back(tok != 0);
  }

  return {inputIds64, attentionMask};
}

std::shared_ptr<OwningArrayBuffer>
TextEmbeddings::generate(const std::string input, bool useMeanPooling) {
  auto preprocessed = preprocess(input);
  auto inputShapes = getAllInputShapes();

  auto tok = make_tensor_ptr(inputShapes[0], preprocessed.first.data(),
                             ScalarType::Long);
  auto attnMask = make_tensor_ptr(inputShapes[1], preprocessed.second.data(),
                                  ScalarType::Long);
  auto forwardResult = BaseModel::forward({tok, attnMask});
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Failed to forward, error: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }
  auto forwardResultTensor = forwardResult->at(0).toTensor();
  auto dataPtr = forwardResultTensor.const_data_ptr();
  auto outputNumel = forwardResultTensor.numel();

  // Create spans for postprocessing
  std::span<const float> modelOutputSpan(static_cast<const float *>(dataPtr),
                                         outputNumel);
  std::span<const int64_t> attnMaskSpan(preprocessed.second.data(),
                                        preprocessed.second.size());

  // Call postprocess to handle mean pooling or raw output
  return postprocess(modelOutputSpan, attnMaskSpan, useMeanPooling);
}

std::shared_ptr<OwningArrayBuffer>
TextEmbeddings::postprocess(std::span<const float> modelOutput,
                            std::span<const int64_t> attentionMask,
                            bool useMeanPooling) {
  if (useMeanPooling) {
    // Convert int64_t attention mask to int32_t for meanPooling
    std::vector<int32_t> attentionMask32;
    attentionMask32.reserve(attentionMask.size());
    for (const auto &mask : attentionMask) {
      attentionMask32.push_back(static_cast<int32_t>(mask));
    }
    std::span<const int32_t> attentionMask32Span(attentionMask32.data(),
                                                 attentionMask32.size());

    // Apply mean pooling
    auto pooledOutput =
        numerical::meanPooling(modelOutput, attentionMask32Span);

    // Create output buffer
    auto bufferSize = pooledOutput.size() * sizeof(float);
    auto outputBuf = std::make_shared<OwningArrayBuffer>(bufferSize);
    std::memcpy(outputBuf->data(), pooledOutput.data(), bufferSize);
    return outputBuf;
  } else {
    // Return raw output without pooling
    auto bufferSize = modelOutput.size() * sizeof(float);
    auto outputBuf = std::make_shared<OwningArrayBuffer>(bufferSize);
    std::memcpy(outputBuf->data(), modelOutput.data(), bufferSize);
    return outputBuf;
  }
}

} // namespace rnexecutorch