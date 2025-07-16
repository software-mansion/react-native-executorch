#include "ReactCommon/CallInvoker.h"
#include "rnexecutorch/models/EncoderDecoderBase.h"
#include <memory>
#include <rnexecutorch/models/speech_to_text/MoonshineStrategy.h>
#include <rnexecutorch/models/speech_to_text/SpeechToText.h>
#include <rnexecutorch/models/speech_to_text/WhisperStrategy.h>
#include <stdexcept>

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
    throw std::runtime_error("Unsupported STT model: " + modelName +
                             ". Only 'whisper' and 'moonshine' are supported.");
  }
}

void SpeechToText::encode(std::span<float> waveform) {
  const auto modelInputTensor = strategy->prepareAudioInput(waveform);

  const auto result = encoder_->forward(modelInputTensor);
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

  const auto prevTokensTensor = strategy->prepareTokenInput(prevTokens);

  const auto decoderMethod = strategy->getDecoderMethod();
  // BEWARE!!!
  // Moonshine will fail with invalid input if you pass large tokens i.e.
  // Whisper's BOS/EOS
  const auto decoderResult =
      decoder_->execute(decoderMethod, {prevTokensTensor, encoderOutput});

  if (!decoderResult.ok()) {
    throw std::runtime_error(
        "Forward pass failed during decoding, error code: " +
        std::to_string(static_cast<int>(decoderResult.error())));
  }

  const auto decoderOutputTensor = decoderResult.get().at(0).toTensor();
  const auto innerDim = decoderOutputTensor.size(1);
  return strategy->extractOutputToken(decoderOutputTensor.const_data_ptr(),
                                      innerDim);
}
} // namespace rnexecutorch
