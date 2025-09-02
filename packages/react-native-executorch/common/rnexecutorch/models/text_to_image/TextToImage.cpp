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
  log(LOG_LEVEL::Info, "Input cpp:", input);
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