#pragma once

#include <atomic>
#include <condition_variable>
#include <mutex>
#include <span>
#include <string>
#include <vector>

#include "common/schema/ASR.h"
#include "common/schema/OnlineASR.h"
#include "common/types/TranscriptionResult.h"
#include <rnexecutorch/models/voice_activity_detection/VoiceActivityDetection.h>

namespace rnexecutorch {

namespace models::speech_to_text {

using voice_activity_detection::VoiceActivityDetection;

class SpeechToText {
public:
  SpeechToText(const std::string &modelName, const std::string &modelSource,
               const std::string &tokenizerSource, const std::string &vadSource,
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

  size_t getMemoryLowerBound() const noexcept;

  // Stream
  void stream(std::shared_ptr<jsi::Function> callback,
              std::string languageOption, bool verbose,
              uint32_t timeout, bool useVAD, uint32_t vadDetectionMargin);
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

  // Lets streamStop() wake the streaming loop immediately instead of
  // waiting for the next throttling interval to expire.
  std::mutex streamCvMutex_;
  std::condition_variable streamCv_;

  // VAD submodule
  std::unique_ptr<VoiceActivityDetection> vad_ = nullptr;
};

} // namespace models::speech_to_text

REGISTER_CONSTRUCTOR(models::speech_to_text::SpeechToText, std::string,
                     std::string, std::string, std::string,
                     std::shared_ptr<react::CallInvoker>);

} // namespace rnexecutorch
