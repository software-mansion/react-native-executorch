#pragma once

#include "SpeechToTextStrategy.h"
#include <vector>

namespace rnexecutorch {

class WhisperStrategy : public SpeechToTextStrategy {
private:
  mutable std::vector<float> preprocessedData;
  mutable std::vector<int32_t> tokens32;

public:
  TensorPtr prepareAudioInput(std::span<float> waveform) override;

  TensorPtr prepareTokenInput(const std::vector<int64_t> &prevTokens) override;

  std::string getDecoderMethod() const override { return "forward"; }

  int64_t extractOutputToken(const void *outputPtr,
                             const std::vector<int32_t> &sizes) const override;
};

} // namespace rnexecutorch
