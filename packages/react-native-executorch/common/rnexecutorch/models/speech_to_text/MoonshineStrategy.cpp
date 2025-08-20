#include "MoonshineStrategy.h"
#include "executorch/runtime/core/exec_aten/exec_aten.h"
#include <executorch/extension/tensor/tensor_ptr_maker.h>
#include <executorch/runtime/core/portable_type/scalar_type.h>

namespace rnexecutorch {

using namespace ::executorch::extension;
using namespace ::executorch::aten;

TensorPtr MoonshineStrategy::prepareAudioInput(std::span<float> waveform) {
  std::vector<int32_t> inputShape = {1, static_cast<int32_t>(waveform.size())};
  return make_tensor_ptr(std::move(inputShape), waveform.data(),
                         ScalarType::Float);
}

TensorPtr
MoonshineStrategy::prepareTokenInput(const std::vector<int64_t> &prevTokens) {
  std::vector<int32_t> tensorSizes = {1,
                                      static_cast<int32_t>(prevTokens.size())};
  // prevTokens gets copied!!
  return make_tensor_ptr(std::move(tensorSizes), prevTokens);
}

std::shared_ptr<OwningArrayBuffer> MoonshineStrategy::extractOutputToken(
    const executorch::aten::Tensor &decoderOutputTensor) const {
  const auto innerDim = decoderOutputTensor.size(1);
  auto dataPtr =
      static_cast<const float *>(decoderOutputTensor.const_data_ptr()) +
      (innerDim - 1);

  std::span<const float> modelOutput(dataPtr, 1);
  auto createBuffer = [](const auto &data, size_t size) {
    auto buffer = std::make_shared<OwningArrayBuffer>(size);
    std::memcpy(buffer->data(), data, size);
    return buffer;
  };
  return createBuffer(modelOutput.data(), modelOutput.size_bytes());
}

} // namespace rnexecutorch
