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

std::shared_ptr<OwningArrayBuffer> WhisperStrategy::extractOutputToken(
    const executorch::aten::Tensor &decoderOutputTensor) const {
  const auto innerDim = decoderOutputTensor.size(1);
  const auto dictSize = decoderOutputTensor.size(2);
  auto outputNumel = decoderOutputTensor.numel();
  auto dataPtr =
      static_cast<const float *>(decoderOutputTensor.const_data_ptr()) +
      (innerDim - 1) * dictSize;

  std::span<const float> modelOutput(dataPtr, outputNumel / innerDim);
  auto createBuffer = [](const auto &data, size_t size) {
    auto buffer = std::make_shared<OwningArrayBuffer>(size);
    std::memcpy(buffer->data(), data, size);
    return buffer;
  };
  return createBuffer(modelOutput.data(), modelOutput.size_bytes());
}

} // namespace rnexecutorch
