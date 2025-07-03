#pragma once

#include <cstdint>
#include <executorch/runtime/core/evalue.h>
#include <rnexecutorch/models/EncoderDecoderBase.h>
#include <span>
#include <vector>

namespace rnexecutorch {

class Moonshine : public EncoderDecoderBase {
public:
  Moonshine(const std::string &encoderPath, const std::string &decoderPath,
            std::shared_ptr<react::CallInvoker> callInvoker);

  void encode(std::span<float> waveform);
  int64_t decode(std::vector<int64_t> prevTokens);

private:
  std::string tokenizerPath_;
  executorch::runtime::EValue encoderOutput_;
};

} // namespace rnexecutorch
