#include "TextToImage.h"

#include <cmath>
#include <random>
#include <span>

#include <rnexecutorch/Log.h>
#include <rnexecutorch/models/text_to_image/Constants.h>

namespace rnexecutorch::models::text_to_image {

TextToImage::TextToImage(const std::string &tokenizerSource,
                         const std::string &encoderSource,
                         const std::string &unetSource,
                         const std::string &decoderSource,
                         float schedulerBetaStart, float schedulerBetaEnd,
                         int32_t schedulerNumTrainTimesteps,
                         int32_t schedulerStepsOffset,
                         std::shared_ptr<react::CallInvoker> callInvoker)
    : callInvoker(callInvoker),
      scheduler(std::make_unique<Scheduler>(
          schedulerBetaStart, schedulerBetaEnd, schedulerNumTrainTimesteps,
          schedulerStepsOffset, callInvoker)),
      encoder(std::make_unique<Encoder>(tokenizerSource, encoderSource,
                                        callInvoker)),
      unet(std::make_unique<UNet>(unetSource, callInvoker)),
      decoder(std::make_unique<Decoder>(decoderSource, callInvoker)) {}

void TextToImage::setImageSize(int32_t imageSize) {
  if (imageSize % 32 != 0) {
    throw std::runtime_error("Image size must be a multiple of 32.");
  }
  this->imageSize = imageSize;
  constexpr int32_t latentDownsample = 8;
  latentImageSize = std::floor(imageSize / latentDownsample);
  unet->latentImageSize = latentImageSize;
  decoder->latentImageSize = latentImageSize;
}
std::shared_ptr<OwningArrayBuffer>
TextToImage::generate(std::string input, int32_t imageSize,
                      size_t numInferenceSteps,
                      std::shared_ptr<jsi::Function> callback) {
  setImageSize(imageSize);
  std::vector<float> embeddings = encoder->generate(input);

  constexpr int32_t latentDownsample = 8;
  int32_t latentsSize = std::floor(imageSize / latentDownsample);
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
        unet->generate(latents, timesteps[t], embeddings);

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
  int32_t imagePixelCount = imageSize * imageSize;
  std::vector<uint8_t> outputRgba(imagePixelCount * 4);
  for (int32_t i = 0; i < imagePixelCount; i++) {
    outputRgba[i * 4 + 0] = output[i * 3 + 0];
    outputRgba[i * 4 + 1] = output[i * 3 + 1];
    outputRgba[i * 4 + 2] = output[i * 3 + 2];
    outputRgba[i * 4 + 3] = 255;
  }

  // TODO: Replace with a function when #584 implemented
  auto createBuffer = [](const auto &data, size_t size) {
    auto buffer = std::make_shared<OwningArrayBuffer>(size);
    std::memcpy(buffer->data(), data, size);
    return buffer;
  };
  return createBuffer(outputRgba.data(), outputRgba.size() * sizeof(float));
}

void TextToImage::interrupt() noexcept { interrupted = true; }

size_t TextToImage::getMemoryLowerBound() const noexcept {
  return encoder->getMemoryLowerBound() + unet->getMemoryLowerBound() +
         decoder->getMemoryLowerBound();
}

void TextToImage::unload() noexcept {
  encoder->unload();
  unet->unload();
  decoder->unload();
}

} // namespace rnexecutorch::models::text_to_image
