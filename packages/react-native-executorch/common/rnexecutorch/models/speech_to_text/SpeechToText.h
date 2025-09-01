#pragma once

#include <cstdint>
#include <memory>
#include <optional>
#include <span>
#include <string>
#include <vector>

#include "ASR.h"
#include "OnlineASRProcessor.h"
#include "ReactCommon/CallInvoker.h"
#include "executorch/runtime/core/evalue.h"
#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"

namespace rnexecutorch {
namespace models::speech_to_text {
class SpeechToText : public ASR {
public:
  explicit SpeechToText(const std::string &encoderSource,
                        const std::string &decoderSource,
                        const std::string &tokenizerSource,
                        std::shared_ptr<react::CallInvoker> callInvoker);

  std::shared_ptr<OwningArrayBuffer> encode(std::vector<float> waveform);

  std::shared_ptr<OwningArrayBuffer> decode(std::vector<int32_t> tokens,
                                            std::vector<float> encoderOutput);

  std::string transcribe(std::vector<float> waveform,
                         std::string languageOption);

  void stream(std::shared_ptr<jsi::Function> callback,
              std::string languageOption);

  void streamStop();

  void streamInsert(std::vector<float> waveform);

private:
  std::shared_ptr<react::CallInvoker> callInvoker;
  std::shared_ptr<OwningArrayBuffer>
  makeOwningBuffer(std::span<const float> vectorView);

  // Stream
  OnlineASRProcessor processor;
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
