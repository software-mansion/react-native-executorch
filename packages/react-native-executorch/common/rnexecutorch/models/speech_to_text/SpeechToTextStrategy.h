#pragma once

#include "executorch/extension/tensor/tensor_ptr.h"
#include <rnexecutorch/host_objects/JSTensorViewOut.h>
#include <span>
#include <vector>

namespace rnexecutorch {

using TensorPtr = ::executorch::extension::TensorPtr;

class SpeechToTextStrategy {
public:
  virtual ~SpeechToTextStrategy() = default;

  virtual TensorPtr prepareAudioInput(std::span<float> waveform) = 0;

  virtual TensorPtr
  prepareTokenInput(const std::vector<int64_t> &prevTokens) = 0;

  virtual std::string getDecoderMethod() const = 0;

  virtual std::shared_ptr<OwningArrayBuffer> extractOutputToken(
      const executorch::aten::Tensor &decoderOutputTensor) const = 0;
};

} // namespace rnexecutorch
