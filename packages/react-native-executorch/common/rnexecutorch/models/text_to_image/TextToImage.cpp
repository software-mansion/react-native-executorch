#include "TextToImage.h"

#include <cmath>
#include <random>
#include <span>

#include <rnexecutorch/Log.h>

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
TextToImage::generate(std::string input, size_t numInferenceSteps,
                      std::shared_ptr<jsi::Function> callback) {
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
  int32_t latentsSize = std::floor(modelImageSize / latentDownsample);
  int32_t latentsImageSize = numChannels * latentsSize * latentsSize;
  std::vector<float> latents(latentsImageSize);
  std::random_device rd;
  std::mt19937 gen(rd());
  std::normal_distribution<float> dist(0.0, 1.0);
  for (auto &val : latents) {
    val = dist(gen);
  }

  scheduler->setTimesteps(numInferenceSteps);
  std::vector<int32_t> timesteps = scheduler->timesteps;

  auto nativeCallback = [this, callback](size_t stepIdx) {
    this->callInvoker->invokeAsync([callback, stepIdx](jsi::Runtime &runtime) {
      callback->call(runtime, jsi::Value(static_cast<int32_t>(stepIdx)));
    });
  };
  for (size_t t = 0; t < numInferenceSteps + 1; t++) {
    if (interrupted) {
      interrupted = false;
      return postprocess({});
    }
    log(LOG_LEVEL::Debug, "Step:", t, "/", numInferenceSteps);

    std::vector<float> noisePred =
        unet->generate(latents, timesteps[t], embeddingsConcat);

    size_t noiseSize = noisePred.size() / 2;
    std::span<const float> noisePredSpan{noisePred};
    std::span<const float> noiseUncond = noisePredSpan.subspan(0, noiseSize);
    std::span<const float> noiseText =
        noisePredSpan.subspan(noiseSize, noiseSize);
    std::vector<float> noise(noiseSize);
    for (size_t i = 0; i < noiseSize; i++) {
      noise[i] =
          noiseUncond[i] * (1 - guidanceScale) + noiseText[i] * guidanceScale;
    }
    latents = scheduler->step(latents, noise, timesteps[t]);

    nativeCallback(t);
  }

  for (auto &val : latents) {
    val /= latentsScale;
  }

  std::vector<float> output = decoder->generate(latents);
  return postprocess(output);
}

std::shared_ptr<OwningArrayBuffer>
TextToImage::postprocess(const std::vector<float> &output) const {
  // Convert RGB to RGBA
  int32_t imagePixelCount = modelImageSize * modelImageSize;
  std::vector<uint8_t> outputRgb(imagePixelCount * 4);
  for (int32_t i = 0; i < imagePixelCount; i++) {
    outputRgb[i * 4 + 0] = output[i * 3 + 0];
    outputRgb[i * 4 + 1] = output[i * 3 + 1];
    outputRgb[i * 4 + 2] = output[i * 3 + 2];
    outputRgb[i * 4 + 3] = 255;
  }

  // Replace with a function when #584 implemented
  auto createBuffer = [](const auto &data, size_t size) {
    auto buffer = std::make_shared<OwningArrayBuffer>(size);
    std::memcpy(buffer->data(), data, size);
    return buffer;
  };
  return createBuffer(outputRgb.data(), outputRgb.size() * sizeof(float));
}

void TextToImage::interrupt() { interrupted = true; }

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
