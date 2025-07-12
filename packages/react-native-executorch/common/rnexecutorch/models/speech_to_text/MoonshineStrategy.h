#pragma once

#include "SpeechToTextStrategy.h"

namespace rnexecutorch {

class MoonshineStrategy : public SpeechToTextStrategy {
public:
  std::pair<TensorPtr, std::vector<int32_t>>
  prepareAudioInput(std::span<float> waveform) override;

  TensorPtr prepareTokenInput(const std::vector<int64_t> &prevTokens) override;

  std::string getDecoderMethod() const override { return "forward_cached"; }

  int64_t extractOutputToken(const void *outputPtr,
                             std::vector<int32_t> &sizes) override;
};

} // namespace rnexecutorch
