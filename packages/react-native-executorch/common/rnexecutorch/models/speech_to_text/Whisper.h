#pragma once

#include <cstdint>
#include <executorch/runtime/core/evalue.h>
#include <rnexecutorch/models/EncoderDecoderBase.h>
#include <rnexecutorch/preprocessors/WhisperPreprocessor.h>
#include <span>
#include <vector>

namespace rnexecutorch {

class Whisper : public EncoderDecoderBase {
public:
  Whisper(const std::string &encoderPath, const std::string &decoderPath,
          std::shared_ptr<react::CallInvoker> callInvoker);

  void encode(std::span<float> waveform);
  int64_t decode(std::vector<int64_t> prevTokens);

private:
  preprocessors::WhisperPreprocessor preprocessor;
  executorch::runtime::EValue encoderOutput_;
};

} // namespace rnexecutorch
