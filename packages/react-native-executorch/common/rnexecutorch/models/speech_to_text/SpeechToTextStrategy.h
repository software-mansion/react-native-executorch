#pragma once

#include "executorch/extension/tensor/tensor_ptr.h"
#include <span>
#include <vector>

namespace rnexecutorch {

using TensorPtr = ::executorch::extension::TensorPtr;

class SpeechToTextStrategy {
public:
  virtual ~SpeechToTextStrategy() = default;

  virtual std::pair<TensorPtr, std::vector<int32_t>>
  prepareAudioInput(std::span<float> waveform) = 0;

  virtual TensorPtr
  prepareTokenInput(const std::vector<int64_t> &prevTokens) = 0;

  virtual std::string getDecoderMethod() const = 0;

  virtual int64_t extractOutputToken(const void *outputPtr,
                                     std::vector<int32_t> &sizes) = 0;
};

} // namespace rnexecutorch
