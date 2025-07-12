#include "executorch/extension/tensor/tensor_ptr.h"
#include "rnexecutorch/data_processing/dsp.h"
#include <rnexecutorch/models/speech_to_text/WhisperStrategy.h>

namespace rnexecutorch {

using namespace ::executorch::extension;
using namespace ::executorch::aten;

std::pair<TensorPtr, std::vector<int32_t>>
WhisperStrategy::prepareAudioInput(std::span<float> waveform) {
  preprocessedData = dsp::stftFromWaveform(waveform, 512, 160);
  auto numFrames = preprocessedData.size() / 256;
  std::vector<int32_t> inputShape = {static_cast<int32_t>(numFrames), 256};

  auto tensorPtr =
      make_tensor_ptr(inputShape, preprocessedData.data(), ScalarType::Float);
  return {tensorPtr, inputShape};
}

TensorPtr
WhisperStrategy::prepareTokenInput(const std::vector<int64_t> &prevTokens) {
  tokens32.clear();
  tokens32.reserve(prevTokens.size());
  for (auto token : prevTokens) {
    tokens32.push_back(static_cast<int32_t>(token));
  }

  std::vector<int32_t> tensorSizes = {1, static_cast<int32_t>(tokens32.size())};
  return make_tensor_ptr(tensorSizes, tokens32.data(), ScalarType::Int);
}

int64_t WhisperStrategy::extractOutputToken(const void *outputPtr,
                                            std::vector<int32_t> &sizes) {
  size_t innerDim = sizes.at(1);
  const int32_t *data = static_cast<const int32_t *>(outputPtr);
  return static_cast<int64_t>(data[innerDim - 1]);
}

} // namespace rnexecutorch
