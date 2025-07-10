#include "ReactCommon/CallInvoker.h"
#include "rnexecutorch/models/EncoderDecoderBase.h"
#include <memory>
#include <rnexecutorch/models/speech_to_text/MoonshineStrategy.h>
#include <rnexecutorch/models/speech_to_text/SpeechToText.h>
#include <rnexecutorch/models/speech_to_text/WhisperStrategy.h>
#include <stdexcept>
#include <string>
#include <vector>

namespace rnexecutorch {

using namespace ::executorch::extension;

SpeechToText::SpeechToText(const std::string &encoderPath,
                           const std::string &decoderPath,
                           const std::string &modelName,
                           std::shared_ptr<react::CallInvoker> callInvoker)
    : EncoderDecoderBase(encoderPath, decoderPath, callInvoker),
      modelName(modelName) {
  initializeStrategy();
}

void SpeechToText::initializeStrategy() {
  if (modelName == "whisper") {
    strategy = std::make_unique<WhisperStrategy>();
  } else if (modelName == "moonshine") {
    strategy = std::make_unique<MoonshineStrategy>();
  } else {
    throw std::runtime_error("Unsupported model: " + modelName +
                             ". Only 'whisper' and 'moonshine' are supported.");
  }
}

void SpeechToText::encode(std::span<float> waveform) {
  auto [modelInputTensor, inputShape] = strategy->prepareAudioInput(waveform);

  auto result = encoder_->forward(modelInputTensor);
  if (!result.ok()) {
    throw std::runtime_error(
        "Forward pass failed during encoding, error code: " +
        std::to_string(static_cast<int>(result.error())));
  }

  encoderOutput = result.get().at(0);
}

int64_t SpeechToText::decode(std::vector<int64_t> prevTokens) {
  if (encoderOutput.isNone()) {
    throw std::runtime_error("Empty encodings on decode call, make sure to "
                             "call encode() prior to decode()!");
  }

  auto prevTokensTensor = strategy->prepareTokenInput(prevTokens);

  auto decoderMethod = strategy->getDecoderMethod();
  // BEWARE!!!
  // Moonshine will fail with invalid input if you pass large tokens i.e.
  // Whisper's BOS/EOS
  auto decoderResult =
      decoder_->execute(decoderMethod, {prevTokensTensor, encoderOutput});

  if (!decoderResult.ok()) {
    throw std::runtime_error(
        "Forward pass failed during decoding, error code: " +
        std::to_string(static_cast<int>(decoderResult.error())));
  }

  auto decoderOutputTensor = decoderResult.get().at(0).toTensor();
  auto decoderOutputTensorSizes = decoderOutputTensor.sizes();
  std::vector<int32_t> sizesVec(decoderOutputTensorSizes.begin(),
                                decoderOutputTensorSizes.end());
  return strategy->extractOutputToken(decoderOutputTensor.const_data_ptr(),
                                      sizesVec);
}
} // namespace rnexecutorch
