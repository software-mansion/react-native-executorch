#pragma once

#include "rnexecutorch/models/speech_to_text/stream/OnlineASRProcessor.h"

namespace rnexecutorch {

namespace models::speech_to_text {

using namespace asr;
using namespace types;
using namespace stream;

class SpeechToText {
public:
  explicit SpeechToText(const std::string &encoderSource,
                        const std::string &decoderSource,
                        const std::string &tokenizerSource,
                        std::shared_ptr<react::CallInvoker> callInvoker);

  std::shared_ptr<OwningArrayBuffer> encode(std::vector<float> waveform) const;
  std::shared_ptr<OwningArrayBuffer>
  decode(std::vector<int32_t> tokens, std::vector<float> encoderOutput) const;
  std::string transcribe(std::vector<float> waveform,
                         std::string languageOption) const;

  size_t getMemoryLowerBound() const noexcept;

  // Stream
  void stream(std::shared_ptr<jsi::Function> callback,
              std::string languageOption);
  void streamStop();
  void streamInsert(std::vector<float> waveform);

private:
  std::unique_ptr<BaseModel> encoder;
  std::unique_ptr<BaseModel> decoder;
  std::unique_ptr<TokenizerModule> tokenizer;
  std::unique_ptr<ASR> asr;

  std::shared_ptr<OwningArrayBuffer>
  makeOwningBuffer(std::span<const float> vectorView) const;

  // Stream
  std::shared_ptr<react::CallInvoker> callInvoker;
  std::unique_ptr<OnlineASRProcessor> processor;
  bool isStreaming;
  bool readyToProcess;

  constexpr static int32_t minAudioSamples = 1 * 16000;

  void resetStreamState();
};

} // namespace models::speech_to_text

REGISTER_CONSTRUCTOR(models::speech_to_text::SpeechToText, std::string,
                     std::string, std::string,
                     std::shared_ptr<react::CallInvoker>);

} // namespace rnexecutorch
