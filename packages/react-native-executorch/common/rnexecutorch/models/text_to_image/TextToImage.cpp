#include "TextToImage.h"

#include <cmath>
#include <random>
#include <span>

#include <executorch/extension/tensor/tensor.h>
#include <opencv2/opencv.hpp>

#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/models/text_to_image/Constants.h>

#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>

namespace rnexecutorch::models::text_to_image {

using namespace executorch::extension;

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
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidConfig,
                            "Image size must be a multiple of 32.");
  }
  this->imageSize = imageSize;
  constexpr int32_t latentDownsample = 8;
  latentImageSize = std::floor(imageSize / latentDownsample);
  unet->latentImageSize = latentImageSize;
  decoder->latentImageSize = latentImageSize;
}

void TextToImage::setSeed(int32_t &seed) {
  // Seed argument is provided
  if (seed >= 0) {
    return;
  }
  std::random_device rd;
  seed = rd();
}

std::string TextToImage::generate(std::string input, int32_t imageSize,
                                  size_t numInferenceSteps, int32_t seed,
                                  std::shared_ptr<jsi::Function> callback) {
  std::scoped_lock lock(inference_mutex_);
  setImageSize(imageSize);
  setSeed(seed);

  std::vector<float> embeddings = encoder->generate(input);
  std::vector<int32_t> embeddingsShape = {2, 77, 768};
  auto embeddingsTensor =
      make_tensor_ptr(embeddingsShape, embeddings.data(), ScalarType::Float);

  int32_t latentsSize = numChannels * latentImageSize * latentImageSize;
  std::vector<float> latents(latentsSize);
  std::mt19937 gen(seed);
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
  for (size_t t = 0; t < numInferenceSteps + 1 && !interrupted; t++) {
    log(LOG_LEVEL::Debug, "Step:", t, "/", numInferenceSteps);

    std::vector<float> noisePred =
        unet->generate(latents, timesteps[t], embeddingsTensor);

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
  if (interrupted) {
    interrupted = false;
    return "";
  }

  for (auto &val : latents) {
    val /= latentsScale;
  }

  std::vector<float> output = decoder->generate(latents);
  return postprocess(output);
}

std::string TextToImage::postprocess(const std::vector<float> &output) const {
  // Decoder output is HWC float RGB (values already in [0..255]). cv::imwrite
  // expects a BGR matrix, so pack the channels in BGR order here.
  cv::Mat bgr(imageSize, imageSize, CV_8UC3);
  for (int32_t y = 0; y < imageSize; ++y) {
    auto *row = bgr.ptr<cv::Vec3b>(y);
    for (int32_t x = 0; x < imageSize; ++x) {
      const int32_t idx = (y * imageSize + x) * 3;
      row[x] = cv::Vec3b(static_cast<uint8_t>(output[idx + 2]),
                         static_cast<uint8_t>(output[idx + 1]),
                         static_cast<uint8_t>(output[idx + 0]));
    }
  }
  return image_processing::saveToTempFile(bgr);
}

void TextToImage::interrupt() noexcept { interrupted = true; }

size_t TextToImage::getMemoryLowerBound() const noexcept {
  return encoder->getMemoryLowerBound() + unet->getMemoryLowerBound() +
         decoder->getMemoryLowerBound();
}

void TextToImage::unload() noexcept {
  std::scoped_lock lock(inference_mutex_);
  encoder->unload();
  unet->unload();
  decoder->unload();
}

} // namespace rnexecutorch::models::text_to_image
