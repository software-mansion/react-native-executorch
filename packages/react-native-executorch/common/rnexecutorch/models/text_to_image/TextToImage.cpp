#include "TextToImage.h"

#include <algorithm>
#include <cmath>
#include <future>
#include <memory>
#include <random>
#include <span>
#include <string>

#include <executorch/extension/tensor/tensor.h>
#include <executorch/extension/tensor/tensor_ptr_maker.h>

#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/host_objects/JsiConversions.h>

namespace rnexecutorch::models::text_to_image {

TextToImage::TextToImage(const std::string &tokenizerSource,
                         float schedulerBetaStart, float schedulerBetaEnd,
                         int32_t schedulerNumTrainTimesteps,
                         int32_t schedulerStepsOffset,
                         const std::string &encoderSource,
                         const std::string &unetSource,
                         const std::string &decoderSource, int32_t imageSize,
                         std::shared_ptr<react::CallInvoker> callInvoker)
    : modelImageSize(imageSize), callInvoker(callInvoker),
      scheduler(std::make_unique<Scheduler>(
          schedulerBetaStart, schedulerBetaEnd, schedulerNumTrainTimesteps,
          schedulerStepsOffset, callInvoker)),
      encoder(std::make_unique<embeddings::TextEmbeddings>(
          encoderSource, tokenizerSource, callInvoker)),
      unet(std::make_unique<UNet>(unetSource, imageSize, numChannels,
                                  callInvoker)),
      decoder(std::make_unique<Decoder>(decoderSource, imageSize, numChannels,
                                        callInvoker)) {}

std::shared_ptr<OwningArrayBuffer>
TextToImage::generate(std::string input, size_t numInferenceSteps) {
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

  constexpr int32_t latentDownsample = 8;
  int32_t latentsWidth = std::floor(modelImageSize / latentDownsample);
  int32_t latentsSize = numChannels * latentsWidth * latentsWidth;
  std::vector<float> latents(latentsSize);
  std::random_device rd;
  std::mt19937 gen(rd());
  std::normal_distribution<float> dist(0.0, 1.0);
  for (auto &val : latents) {
    val = dist(gen);
  }

  scheduler->setTimesteps(numInferenceSteps);
  std::vector<int32_t> timesteps = scheduler->timesteps;

  for (size_t t = 0; t < numInferenceSteps + 1; t++) {
    log(LOG_LEVEL::Debug, "Step: ", t, "/", numInferenceSteps);
    std::vector<float> latentsConcat;
    latentsConcat.reserve(2 * latentsSize);
    latentsConcat.insert(latentsConcat.end(), latents.begin(), latents.end());
    latentsConcat.insert(latentsConcat.end(), latents.begin(), latents.end());

    std::vector<float> noisePred =
        unet->generate(latentsConcat, timesteps[t], embeddingsConcat);

    size_t noiseSize = noisePred.size() / 2;
    std::span<const float> noisePredSpan{noisePred};
    std::span<const float> noiseUncond = noisePredSpan.subspan(0, noiseSize);
    std::span<const float> noiseText =
        noisePredSpan.subspan(noiseSize, noiseSize);
    std::vector<float> noise(noiseSize);
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
  size_t X = 3;
  size_t Y = modelImageSize;
  size_t Z = modelImageSize;
  // TODO export inside of the model
  for (size_t x = 0; x < X; x++) {
    for (size_t y = 0; y < Y; y++) {
      for (size_t z = 0; z < Z; z++) {
        // Rearrange pixel channels to follow RGB order
        size_t idx = x * Y * Z + y * Z + z;
        size_t newIdx = y * Z * X + z * X + x;

        auto val = output[idx];
        val = val / 2 + 0.5;
        val = std::clamp(val, 0.0f, 1.0f);
        val *= 255;
        imageData[newIdx] = val;
      }
    }
  }
  std::span<float> modelOutput(static_cast<float *>(imageData.data()),
                               imageData.size());
  // Replace with a function when #584 implemented
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
