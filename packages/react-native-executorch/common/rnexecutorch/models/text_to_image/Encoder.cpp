#include "Encoder.h"

#include <cmath>
#include <random>
#include <span>

#include <rnexecutorch/models/text_to_image/Constants.h>

namespace rnexecutorch::models::text_to_image {

Encoder::Encoder(const std::string &tokenizerSource,
                 const std::string &encoderSource,
                 std::shared_ptr<react::CallInvoker> callInvoker)
    : callInvoker(callInvoker),
      encoder(std::make_unique<embeddings::TextEmbeddings>(
          encoderSource, tokenizerSource, callInvoker)) {}

std::vector<float> Encoder::generate(std::string input) {
  std::shared_ptr<OwningArrayBuffer> embeddingsText = encoder->generate(input);
  std::shared_ptr<OwningArrayBuffer> embeddingsUncond =
      encoder->generate(std::string(constants::kBosToken));

  size_t embeddingsSize = embeddingsText->size() / sizeof(float);
  auto *embeddingsTextPtr = reinterpret_cast<float *>(embeddingsText->data());
  auto *embeddingsUncondPtr =
      reinterpret_cast<float *>(embeddingsUncond->data());

  std::vector<float> embeddingsConcat;
  embeddingsConcat.reserve(embeddingsSize * 2);
  embeddingsConcat.insert(embeddingsConcat.end(), embeddingsUncondPtr,
                          embeddingsUncondPtr + embeddingsSize);
  embeddingsConcat.insert(embeddingsConcat.end(), embeddingsTextPtr,
                          embeddingsTextPtr + embeddingsSize);
  return embeddingsConcat;
}

size_t Encoder::getMemoryLowerBound() const noexcept {
  return encoder->getMemoryLowerBound();
}

void Encoder::unload() noexcept { encoder.reset(nullptr); }

} // namespace rnexecutorch::models::text_to_image
