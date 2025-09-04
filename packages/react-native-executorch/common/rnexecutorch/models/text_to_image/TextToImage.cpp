#include "TextToImage.h"

#include <future>
#include <memory>
#include <string>
#include <cmath>
#include <random>

#include <executorch/extension/tensor/tensor.h>
#include <executorch/extension/tensor/tensor_ptr_maker.h>

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
    unet(std::make_unique<UNet>(unetSource, batchSize, imageSize, numChannels, callInvoker)),
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

  float* uncondData = reinterpret_cast<float*>(uncondEmbeddings->data());
  int uncondN = uncondEmbeddings->size() / sizeof(float);
  
  float* condData = reinterpret_cast<float*>(embeddings->data());
  int condN = embeddings->size() / sizeof(float);
  
  std::vector<float> embeddingsConcat;
  embeddingsConcat.reserve(uncondN + condN);
  
  embeddingsConcat.insert(embeddingsConcat.end(), uncondData, uncondData + uncondN);
  embeddingsConcat.insert(embeddingsConcat.end(), condData, condData + condN);

  log(LOG_LEVEL::Info, "Text embeddings:", n, "\n", embeddingsConcat[0],
      embeddingsConcat[1], embeddingsConcat[2], "...", embeddingsConcat[n - 3],
      embeddingsConcat[n - 2], embeddingsConcat[n - 1]);

  int latentsWidth = std::floor(modelImageSize / 8);
  int latentsSize = numChannels * batchSize * latentsWidth * latentsWidth;
  std::vector<float> latents(latentsSize);
  for (int i = 0; i < latentsSize; i+=2) {
    latents[i] = 0.5;
    if (i+1 < latentsSize) { // !!
      latents[i+1] = -0.5;
    }
  }
  // std::random_device rd;
  // std::mt19937 gen(rd());
  // std::normal_distribution<float> dist(0.0, 1.0);
  // for (auto & val : latents) {
  //   val = dist(gen);
  // }

  scheduler->setTimesteps(numInferenceSteps);
  std::vector<int> timesteps = scheduler->timesteps;

  for (auto t : timesteps) {
    log(LOG_LEVEL::Info, "t =", t);
    std::vector<float> latentsConcat;
    latentsConcat.insert(latentsConcat.end(), latents.begin(), latents.end());
    latentsConcat.insert(latentsConcat.end(), latents.begin(), latents.end());

    std::vector<float> noisePred = unet->generate(latentsConcat, t, embeddingsConcat);
    int noiseSize = static_cast<int>(noisePred.size() / 2);
    log(LOG_LEVEL::Info, "NoisePred:", noisePred.size(), "\n", noisePred[0],
      noisePred[1], noisePred[2], "...", noisePred[noisePred.size() - 3],
      noisePred[noisePred.size() - 2], noisePred[noisePred.size() - 1]);
    std::vector<float> noiseUncond(noisePred.begin(), noisePred.begin() + noiseSize);
    std::vector<float> noiseText(noisePred.begin() + noiseSize, noisePred.end());
    std::vector<float> noise(noiseUncond);
    for (int i = 0; i < noiseSize; i++) {
      noise[i] = noiseUncond[i] * (1 - guidanceScale) + noiseText[i] * guidanceScale;
    }
    log(LOG_LEVEL::Info, "Noise:", noise.size(), "\n", noise[0],
      noise[1], noise[2], "...", noise[noise.size() - 3],
      noise[noise.size() - 2], noise[noise.size() - 1]);
    // latents = scheduler.step(noise, t, latents); // order of arguments!!
    break;
  }
}

size_t TextToImage::getMemoryLowerBound() const noexcept {
  return encoder->getMemoryLowerBound() + unet->getMemoryLowerBound(); // + decoder->getMemoryLowerBound();
}

void TextToImage::unload() noexcept {
  encoder.reset(nullptr);
  unet.reset(nullptr);
  // decoder.reset(nullptr);
}

} // namespace rnexecutorch::models::text_to_image