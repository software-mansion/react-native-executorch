#pragma once

#include "SpeechToTextStrategy.h"
#include <span>
#include <vector>

namespace rnexecutorch {

class MoonshineStrategy final : public SpeechToTextStrategy {
public:
  TensorPtr prepareAudioInput(std::span<float> waveform) override;

  TensorPtr prepareTokenInput(const std::vector<int64_t> &prevTokens) override;

  std::string getDecoderMethod() const override { return "forward_cached"; }

  std::shared_ptr<OwningArrayBuffer> extractOutputToken(
      const executorch::aten::Tensor &decoderOutputTensor) const override;
};

} // namespace rnexecutorch
