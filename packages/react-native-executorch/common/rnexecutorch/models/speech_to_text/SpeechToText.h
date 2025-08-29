#pragma once

#include "ReactCommon/CallInvoker.h"
#include "executorch/runtime/core/evalue.h"
#include <cstdint>
#include <memory>
#include <span>
#include <string>
#include <vector>

#include "rnexecutorch/metaprogramming/ConstructorHelpers.h"
#include <rnexecutorch/models/EncoderDecoderBase.h>
#include <rnexecutorch/models/speech_to_text/SpeechToTextStrategy.h>

namespace rnexecutorch {
namespace models::speech_to_text {
class SpeechToText : public EncoderDecoderBase {
public:
  explicit SpeechToText(const std::string &encoderPath,
                        const std::string &decoderPath,
                        const std::string &modelName,
                        std::shared_ptr<react::CallInvoker> callInvoker);
  void encode(std::span<float> waveform);
  std::shared_ptr<OwningArrayBuffer> decode(std::vector<int64_t> prevTokens);

private:
  const std::string modelName;
  executorch::runtime::EValue encoderOutput;
  std::unique_ptr<SpeechToTextStrategy> strategy;

  void initializeStrategy();
};
} // namespace models::speech_to_text

REGISTER_CONSTRUCTOR(models::speech_to_text::SpeechToText, std::string,
                     std::string, std::string,
                     std::shared_ptr<react::CallInvoker>);
} // namespace rnexecutorch
