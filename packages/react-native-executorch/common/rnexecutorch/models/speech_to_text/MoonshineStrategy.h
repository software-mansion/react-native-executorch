#pragma once

#include "SpeechToTextStrategy.h"

namespace rnexecutorch {

class MoonshineStrategy : public SpeechToTextStrategy {
public:
  TensorPtr prepareAudioInput(std::span<float> waveform) override;

  TensorPtr prepareTokenInput(const std::vector<int64_t> &prevTokens) override;

  std::string getDecoderMethod() const override { return "forward_cached"; }

  int64_t extractOutputToken(const void *outputPtr,
                             const std::vector<int32_t> &sizes) const override;
};

} // namespace rnexecutorch
