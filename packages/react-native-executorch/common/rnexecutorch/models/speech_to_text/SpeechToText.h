#pragma once

#include "rnexecutorch/models/speech_to_text/stream/OnlineASRProcessor.h"
#include <span>
#include <string>
#include <vector>

namespace rnexecutorch {

namespace models::speech_to_text {

class SpeechToText {
public:
  explicit SpeechToText(const std::string &encoderSource,
                        const std::string &decoderSource,
                        const std::string &tokenizerSource,
                        std::shared_ptr<react::CallInvoker> callInvoker);

  void unload() noexcept;
  [[nodiscard(
      "Registered non-void function")]] std::shared_ptr<OwningArrayBuffer>
  encode(std::span<float> waveform) const;
  [[nodiscard(
      "Registered non-void function")]] std::shared_ptr<OwningArrayBuffer>
  decode(std::span<uint64_t> tokens, std::span<float> encoderOutput) const;
  [[nodiscard("Registered non-void function")]] std::vector<char>
  transcribe(std::span<float> waveform, std::string languageOption) const;

  size_t getMemoryLowerBound() const noexcept;

  // Stream
  void stream(std::shared_ptr<jsi::Function> callback,
              std::string languageOption);
  void streamStop();
  void streamInsert(std::span<float> waveform);

private:
  std::shared_ptr<react::CallInvoker> callInvoker;
  std::unique_ptr<BaseModel> encoder;
  std::unique_ptr<BaseModel> decoder;
  std::unique_ptr<TokenizerModule> tokenizer;
  std::unique_ptr<asr::ASR> asr;

  // Stream
  std::unique_ptr<stream::OnlineASRProcessor> processor;
  bool isStreaming;
  bool readyToProcess;

  constexpr static int32_t kMinAudioSamples = 16000; // 1 second

  void resetStreamState();
};

} // namespace models::speech_to_text

REGISTER_CONSTRUCTOR(models::speech_to_text::SpeechToText, std::string,
                     std::string, std::string,
                     std::shared_ptr<react::CallInvoker>);

} // namespace rnexecutorch
