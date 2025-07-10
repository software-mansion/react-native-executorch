#pragma once

#include "ReactCommon/CallInvoker.h"
#include "executorch/runtime/core/evalue.h"
#include <cstdint>
#include <memory>
#include <rnexecutorch/models/EncoderDecoderBase.h>
#include <rnexecutorch/models/speech_to_text/SpeechToTextStrategy.h>
#include <span>
#include <vector>

namespace rnexecutorch {
class SpeechToText : public EncoderDecoderBase {
public:
  SpeechToText(const std::string &encoderPath, const std::string &decoderPath,
               const std::string &modelName,
               std::shared_ptr<react::CallInvoker> callInvoker);
  void encode(std::span<float> waveform);
  int64_t decode(std::vector<int64_t> prevTokens);

private:
  const std::string modelName;
  executorch::runtime::EValue encoderOutput;
  std::unique_ptr<SpeechToTextStrategy> strategy;

  void initializeStrategy();
};
} // namespace rnexecutorch
