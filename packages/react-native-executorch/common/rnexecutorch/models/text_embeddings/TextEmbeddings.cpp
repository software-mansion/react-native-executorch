#include "TextEmbeddings.h"
#include <cmath>
#include <executorch/extension/tensor/tensor_ptr_maker.h>
#include <stdexcept>

namespace rnexecutorch {

using namespace executorch::extension;

TextEmbeddings::TextEmbeddings(const std::string &modelSource,
                               const std::string &tokenizerSource,
                               std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker),
      tokenizer(
          std::make_unique<TokenizerModule>(tokenizerSource, callInvoker)) {};

std::pair<std::vector<int32_t>, std::vector<int32_t>>
TextEmbeddings::preprocess(const std::string &input) {
  auto inputIds = tokenizer->encode(input);
  std::vector<int32_t> attentionMask;
  attentionMask.reserve(inputIds.size());

  for (const auto &tok : inputIds) {
    attentionMask.push_back(tok != 0);
  }

  return {inputIds, attentionMask};
}

std::shared_ptr<OwningArrayBuffer>
TextEmbeddings::generate(const std::string &input, bool useMeanPooling = true) {
  auto preprocessed = preprocess(input);
}

} // namespace rnexecutorch