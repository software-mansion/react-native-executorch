#pragma once

#include "SpeechToTextStrategy.h"
#include <span>
#include <vector>

namespace rnexecutorch {

class WhisperStrategy final : public SpeechToTextStrategy {
public:
  TensorPtr prepareAudioInput(std::span<float> waveform) override;

  TensorPtr prepareTokenInput(const std::vector<int64_t> &prevTokens) override;

  std::string getDecoderMethod() const override { return "forward"; }

  std::shared_ptr<OwningArrayBuffer> extractOutputToken(
      const executorch::aten::Tensor &decoderOutputTensor) const override;

private:
  std::vector<float> preprocessedData;
  std::vector<int32_t> tokens32;
};

} // namespace rnexecutorch
