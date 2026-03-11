#pragma once

#include <atomic>
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
  SpeechToText(const std::string &modelName, const std::string &modelSource,
               const std::string &tokenizerSource,
               std::shared_ptr<react::CallInvoker> callInvoker);

  // Required because of std::atomic usage
  SpeechToText(SpeechToText &&other) noexcept;

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
  void resetStreamState();

  std::shared_ptr<react::CallInvoker> callInvoker_;

  // ASR-like module (both static transcription & streaming)
  std::unique_ptr<schema::ASR> transcriber_ = nullptr;

  // Online ASR-like module (streaming only)
  std::unique_ptr<schema::OnlineASR> streamer_ = nullptr;
  std::atomic<bool> isStreaming_ = false;
  std::atomic<bool> readyToProcess_ = false;
};

} // namespace models::speech_to_text

REGISTER_CONSTRUCTOR(models::speech_to_text::SpeechToText, std::string,
                     std::string, std::string,
                     std::shared_ptr<react::CallInvoker>);

} // namespace rnexecutorch
