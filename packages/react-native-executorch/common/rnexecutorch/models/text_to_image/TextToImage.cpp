#include "TextToImage.h"

#include <future>
#include <memory>
#include <string>
#include <cmath>
#include <random>

#include <executorch/extension/tensor/tensor.h>

#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/data_processing/Numerical.h>
#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/models/text_to_image/Constants.h>
#include <rnexecutorch/models/text_to_image/Scheduler.h>
#include <rnexecutorch/models/text_to_image/UNet.h>
#include <rnexecutorch/models/embeddings/text/TextEmbeddings.h>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/models/text_to_image/Constants.h>
#include <ReactCommon/CallInvoker.h>
#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch::models::text_to_image {

TextToImage::TextToImage(
  const std::string &tokenizerSource,
  const std::string &schedulerSource,
  const std::string &encoderSource,
  const std::string &unetSource,
  const std::string &decoderSource,
  int imageSize,
  std::shared_ptr<react::CallInvoker> callInvoker)
  : callInvoker(callInvoker),
    scheduler(std::make_unique<Scheduler>(schedulerSource, callInvoker)),
    encoder(std::make_unique<embeddings::TextEmbeddings>(encoderSource, tokenizerSource, callInvoker)),
    unet(std::make_unique<UNet>(unetSource, callInvoker)),
    modelImageSize(imageSize) {}

void TextToImage::generate(std::string input, int numInferenceSteps) {
  log(LOG_LEVEL::Info, "Prompt:", input);
  std::shared_ptr<OwningArrayBuffer> embeddings = encoder->generate(input);
  float* logData = reinterpret_cast<float*>(embeddings->data());
  int n = embeddings->size() / sizeof(logData[0]);
  log(LOG_LEVEL::Info, "Embeddings:", n, "\n", logData[0], logData[1], logData[2], "...", logData[n-3], logData[n-2], logData[n-1]);

  std::shared_ptr<OwningArrayBuffer> uncondEmbeddings = encoder->generate(constants::kBosToken);
  logData = reinterpret_cast<float*>(uncondEmbeddings->data());
  n = uncondEmbeddings->size() / sizeof(logData[0]);
  log(LOG_LEVEL::Info, "Uncond embeddings:", n, "\n", logData[0], logData[1], logData[2], "...", logData[n-3], logData[n-2], logData[n-1]);


  size_t concatSize = embeddings->size() + uncondEmbeddings->size();
  auto concatEmbeddings = std::make_shared<rnexecutorch::OwningArrayBuffer>(concatSize);
  std::memcpy(concatEmbeddings->data(), uncondEmbeddings->data(),
              uncondEmbeddings->size());
  std::memcpy(concatEmbeddings->data() + uncondEmbeddings->size(),
              embeddings->data(), embeddings->size());

  float* concatData = reinterpret_cast<float*>(concatEmbeddings->data());
  n = concatSize / sizeof(concatData[0]);
  log(LOG_LEVEL::Info, "Text embeddings:", n, "\n", concatData[0],
      concatData[1], concatData[2], "...", concatData[n - 3],
      concatData[n - 2], concatData[n - 1]);

  int numChannels = 4;
  int latentWidth = std::floor(modelImageSize / 8);
  int latentSize = numChannels * batchSize * latentWidth * latentWidth;
  auto buffer = std::make_shared<OwningArrayBuffer>(latentSize * sizeof(float));
  float* data = reinterpret_cast<float*>(buffer->data());

  std::random_device rd;
  std::mt19937 gen(rd());
  std::normal_distribution<float> dist(0.0, 1.0);
  for (int i = 0; i < latentSize; i++) {
    data[i] = dist(gen);
  }

  scheduler->setTimesteps(numInferenceSteps);
  std::vector<int> timesteps = scheduler->timesteps;
  // log(LOG_LEVEL::Info, "Timesteps:");
  // for (auto t : timesteps) {
  //   log(LOG_LEVEL::Info, t);
  // }
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