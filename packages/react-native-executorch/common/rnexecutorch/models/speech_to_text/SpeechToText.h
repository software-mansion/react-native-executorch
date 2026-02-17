#pragma once

#include <span>
#include <string>
#include <vector>

#include "common/schema/ASR.h"
#include "common/schema/OnlineASR.h"
#include "common/types/TranscriptionResult.h"

namespace rnexecutorch {

namespace models::speech_to_text {

class SpeechToText {
public:
  explicit SpeechToText(const std::string &modelName,
                        const std::string &modelSource,
                        const std::string &tokenizerSource,
                        std::shared_ptr<react::CallInvoker> callInvoker);

  void unload() noexcept;
  [[nodiscard(
      "Registered non-void function")]] std::shared_ptr<OwningArrayBuffer>
  encode(std::span<float> waveform) const;
  [[nodiscard(
      "Registered non-void function")]] std::shared_ptr<OwningArrayBuffer>
  decode(std::span<uint64_t> tokens, std::span<float> encoderOutput) const;
  [[nodiscard("Registered non-void function")]]
  TranscriptionResult transcribe(std::span<float> waveform,
                                 std::string languageOption,
                                 bool verbose) const;

  [[nodiscard("Registered non-void function")]]
  std::vector<char> transcribeStringOnly(std::span<float> waveform,
                                         std::string languageOption) const;

  size_t getMemoryLowerBound() const noexcept;

  // Stream
  void stream(std::shared_ptr<jsi::Function> callback,
              std::string languageOption, bool enableTimestamps);
  void streamStop();
  void streamInsert(std::span<float> waveform);

private:
  // Helper functions
  void resetStreamState();

  std::shared_ptr<react::CallInvoker> callInvoker_;

  // ASR-like module (both static transcription & streaming)
  std::unique_ptr<schema::ASR> transcriber_ = nullptr;

  // Online ASR-like module (streaming only)
  std::unique_ptr<schema::OnlineASR> streamer_ = nullptr;
  bool isStreaming_ = false;
  bool readyToProcess_ = true;
};

} // namespace models::speech_to_text

REGISTER_CONSTRUCTOR(models::speech_to_text::SpeechToText, std::string,
                     std::string, std::string,
                     std::shared_ptr<react::CallInvoker>);

} // namespace rnexecutorch
