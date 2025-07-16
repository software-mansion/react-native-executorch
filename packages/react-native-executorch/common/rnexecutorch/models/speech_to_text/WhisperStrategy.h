#pragma once

#include "SpeechToTextStrategy.h"
#include <vector>

namespace rnexecutorch {

class WhisperStrategy final : public SpeechToTextStrategy {
public:
  TensorPtr prepareAudioInput(std::span<float> waveform) override;

  TensorPtr prepareTokenInput(const std::vector<int64_t> &prevTokens) override;

  std::string getDecoderMethod() const override { return "forward"; }

  int64_t extractOutputToken(const void *outputPtr,
                             size_t innerDim) const override;

private:
  std::vector<float> preprocessedData;
  std::vector<int32_t> tokens32;
};

} // namespace rnexecutorch
