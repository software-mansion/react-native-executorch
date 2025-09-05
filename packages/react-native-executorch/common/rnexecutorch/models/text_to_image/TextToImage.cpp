#include "TextToImage.h"

#include <cmath>
#include <future>
#include <memory>
#include <random>
#include <string>

#include <executorch/extension/tensor/tensor.h>
#include <executorch/extension/tensor/tensor_ptr_maker.h>

#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/host_objects/JsiConversions.h>

namespace rnexecutorch::models::text_to_image {

TextToImage::TextToImage(const std::string &tokenizerSource,
                         const std::string &schedulerSource,
                         const std::string &encoderSource,
                         const std::string &unetSource,
                         const std::string &decoderSource, int imageSize,
                         std::shared_ptr<react::CallInvoker> callInvoker)
    : callInvoker(callInvoker), modelImageSize(imageSize),
      scheduler(std::make_unique<Scheduler>(schedulerSource, callInvoker)),
      encoder(std::make_unique<embeddings::TextEmbeddings>(
          encoderSource, tokenizerSource, callInvoker)),
      unet(std::make_unique<UNet>(unetSource, imageSize, numChannels,
                                  callInvoker)),
      decoder(std::make_unique<Decoder>(decoderSource, imageSize, numChannels,
                                        callInvoker)) {}

std::shared_ptr<OwningArrayBuffer>
TextToImage::generate(std::string input, int numInferenceSteps) {
  std::shared_ptr<OwningArrayBuffer> embeddings = encoder->generate(input);
  std::shared_ptr<OwningArrayBuffer> uncondEmbeddings =
      encoder->generate(constants::kBosToken);

  float *uncondData = reinterpret_cast<float *>(uncondEmbeddings->data());
  int uncondN = uncondEmbeddings->size() / sizeof(float);

  float *condData = reinterpret_cast<float *>(embeddings->data());
  int condN = embeddings->size() / sizeof(float);

  std::vector<float> embeddingsConcat;
  embeddingsConcat.reserve(uncondN + condN);
  embeddingsConcat.insert(embeddingsConcat.end(), uncondData,
                          uncondData + uncondN);
  embeddingsConcat.insert(embeddingsConcat.end(), condData, condData + condN);

  int latentsWidth = std::floor(modelImageSize / 8);
  int latentsSize = numChannels * latentsWidth * latentsWidth;
  std::vector<float> latents(latentsSize);
  std::random_device rd;
  std::mt19937 gen(rd());
  std::normal_distribution<float> dist(0.0, 1.0);
  for (auto &val : latents) {
    val = dist(gen);
  }

  scheduler->setTimesteps(numInferenceSteps);
  std::vector<int> timesteps = scheduler->timesteps;

  for (int t = 0; t < numInferenceSteps + 1; t++) {
    log(LOG_LEVEL::Info, "Step", t, "/", numInferenceSteps);
    std::vector<float> latentsConcat;
    latentsConcat.insert(latentsConcat.end(), latents.begin(), latents.end());
    latentsConcat.insert(latentsConcat.end(), latents.begin(), latents.end());

    std::vector<float> noisePred =
        unet->generate(latentsConcat, timesteps[t], embeddingsConcat);

    int noiseSize = static_cast<int>(noisePred.size() / 2);
    std::vector<float> noiseUncond(noisePred.begin(),
                                   noisePred.begin() + noiseSize);
    std::vector<float> noiseText(noisePred.begin() + noiseSize,
                                 noisePred.end());
    std::vector<float> noise(noiseUncond);
    for (int i = 0; i < noiseSize; i++) {
      noise[i] =
          noiseUncond[i] * (1 - guidanceScale) + noiseText[i] * guidanceScale;
    }
    latents = scheduler->step(latents, noise, timesteps[t]);
  }

  for (auto &val : latents) {
    val /= latentsScale;
  }

  std::vector<float> output = decoder->generate(latents);
  return postprocess(output);
}

std::shared_ptr<OwningArrayBuffer>
TextToImage::postprocess(const std::vector<float> &output) {
  std::vector<float> imageData(output.size());
  int X = 3, Y = modelImageSize, Z = modelImageSize;
  for (int x = 0; x < X; x++) {
    for (int y = 0; y < Y; y++) {
      for (int z = 0; z < Z; z++) {
        int idx = x * Y * Z + y * Z + z;
        int newIdx = y * Z * X + z * X + x;

        auto val = output[idx];
        val = val / 2 + 0.5;
        val = std::min(std::max(val, 0.0f), 1.0f);
        val *= 255;
        imageData[newIdx] = val;
      }
    }
  }
  int imageDataSize = static_cast<int>(imageData.size());
  std::span<float> modelOutput(static_cast<float *>(imageData.data()),
                               imageData.size());

  auto createBuffer = [](const auto &data, size_t size) {
    auto buffer = std::make_shared<OwningArrayBuffer>(size);
    std::memcpy(buffer->data(), data, size);
    return buffer;
  };
  return createBuffer(modelOutput.data(), modelOutput.size_bytes());
}

size_t TextToImage::getMemoryLowerBound() const noexcept {
  return encoder->getMemoryLowerBound() + unet->getMemoryLowerBound() +
         decoder->getMemoryLowerBound();
}

void TextToImage::unload() noexcept {
  encoder.reset(nullptr);
  unet.reset(nullptr);
  decoder.reset(nullptr);
}

} // namespace rnexecutorch::models::text_to_image