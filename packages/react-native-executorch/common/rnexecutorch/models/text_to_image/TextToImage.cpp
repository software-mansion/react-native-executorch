#include "TextToImage.h"

#include <future>
#include <memory>
#include <string>

#include <executorch/extension/tensor/tensor.h>

#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/data_processing/Numerical.h>
#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/models/text_to_image/Constants.h>
#include <rnexecutorch/models/embeddings/text/TextEmbeddings.h>
#include <rnexecutorch/Log.h>
#include <ReactCommon/CallInvoker.h>
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch::models::text_to_image {

TextToImage::TextToImage(
  const std::string &tokenizerSource,
  const std::string &schedulerSource,
  const std::string &encoderSource,
  const std::string &transformerSource,
  const std::string &decoderSource,
  int imageSize,
  std::shared_ptr<react::CallInvoker> callInvoker)
  : callInvoker(callInvoker),
    encoder(std::make_unique<embeddings::TextEmbeddings>(encoderSource, tokenizerSource, callInvoker)),
    modelImageSize(imageSize) {}

void TextToImage::generate(std::string input, int numSteps) {
  log(LOG_LEVEL::Info, "Prompt:", input);
  std::shared_ptr<OwningArrayBuffer> embeddings = encoder->generate(input);
  float* data = reinterpret_cast<float*>(embeddings->data());
  int n = embeddings->size() / sizeof(data[0]);
  log(LOG_LEVEL::Info, "Embeddings:", n, "\n", data[0], data[1], data[2], "...", data[n-3], data[n-2], data[n-1]);

  std::shared_ptr<OwningArrayBuffer> uncond_embeddings = encoder->generate("<|startoftext|>");
  data = reinterpret_cast<float*>(uncond_embeddings->data());
  n = uncond_embeddings->size() / sizeof(data[0]);
  log(LOG_LEVEL::Info, "Uncond embeddings:", n, "\n", data[0], data[1], data[2], "...", data[n-3], data[n-2], data[n-1]);
}

size_t TextToImage::getMemoryLowerBound() const noexcept {
  return encoder->getMemoryLowerBound(); // + transformer->getMemoryLowerBound() + decoder->getMemoryLowerBound();
}

void TextToImage::unload() noexcept {
  encoder.reset(nullptr);
  // transformer.reset(nullptr);
  // decoder.reset(nullptr);
}

} // namespace rnexecutorch::models::text_to_image