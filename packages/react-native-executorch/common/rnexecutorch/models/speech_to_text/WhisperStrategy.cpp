#include "executorch/extension/tensor/tensor_ptr.h"
#include "rnexecutorch/data_processing/dsp.h"
#include <rnexecutorch/models/speech_to_text/WhisperStrategy.h>

namespace rnexecutorch {

using namespace ::executorch::extension;
using namespace ::executorch::aten;

TensorPtr WhisperStrategy::prepareAudioInput(std::span<float> waveform) {
  constexpr auto fftWindowSize = 512;
  constexpr auto stftHopLength = 160;
  constexpr auto innerDim = 256;
  preprocessedData =
      dsp::stftFromWaveform(waveform, fftWindowSize, stftHopLength);
  const auto numFrames = preprocessedData.size() / innerDim;
  std::vector<int32_t> inputShape = {static_cast<int32_t>(numFrames), innerDim};
  return make_tensor_ptr(std::move(inputShape), std::move(preprocessedData));
}

TensorPtr
WhisperStrategy::prepareTokenInput(const std::vector<int64_t> &prevTokens) {
  tokens32.clear();
  tokens32.reserve(prevTokens.size());
  for (auto token : prevTokens) {
    tokens32.push_back(static_cast<int32_t>(token));
  }
  auto tensorSizes = {1, static_cast<int32_t>(tokens32.size())};
  return make_tensor_ptr(std::move(tensorSizes), std::move(tokens32));
}

int64_t WhisperStrategy::extractOutputToken(const void *outputPtr,
                                            size_t innerDim) const {
  const auto *data = static_cast<const int32_t *>(outputPtr);
  return static_cast<int64_t>(data[innerDim - 1]);
}

} // namespace rnexecutorch
