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
  } else {
    throw std::runtime_error("Unsupported STT model: " + modelName +
                             ". Only 'whisper' is supported.");
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

std::shared_ptr<OwningArrayBuffer>
SpeechToText::decode(std::vector<int64_t> prevTokens) {
  if (encoderOutput.isNone()) {
    throw std::runtime_error("Empty encodings on decode call, make sure to "
                             "call encode() prior to decode()!");
  }

  const auto prevTokensTensor = strategy->prepareTokenInput(prevTokens);

  const auto decoderMethod = strategy->getDecoderMethod();
  const auto decoderResult =
      decoder_->execute(decoderMethod, {prevTokensTensor, encoderOutput});

  if (!decoderResult.ok()) {
    throw std::runtime_error(
        "Forward pass failed during decoding, error code: " +
        std::to_string(static_cast<int>(decoderResult.error())));
  }

  const auto decoderOutputTensor = decoderResult.get().at(0).toTensor();
  const auto innerDim = decoderOutputTensor.size(1);
  return strategy->extractOutputToken(decoderOutputTensor);
}

} // namespace rnexecutorch
