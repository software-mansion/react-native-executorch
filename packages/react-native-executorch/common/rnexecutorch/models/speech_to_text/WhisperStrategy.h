#pragma once

#include "SpeechToTextStrategy.h"
#include <vector>

namespace rnexecutorch {

class WhisperStrategy : public SpeechToTextStrategy {
private:
  mutable std::vector<float> preprocessedData;
  mutable std::vector<int32_t> tokens32;

public:
  std::pair<TensorPtr, std::vector<int32_t>>
  prepareAudioInput(std::span<float> waveform) override;

  TensorPtr prepareTokenInput(const std::vector<int64_t> &prevTokens) override;

  std::string getDecoderMethod() const override { return "forward"; }

  int64_t extractOutputToken(const void *outputPtr,
                             std::vector<int32_t> &sizes) override;
};

} // namespace rnexecutorch
