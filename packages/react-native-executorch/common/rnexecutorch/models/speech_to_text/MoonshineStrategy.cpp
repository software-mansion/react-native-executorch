#include "MoonshineStrategy.h"
#include <executorch/extension/tensor/tensor_ptr_maker.h>
#include <executorch/runtime/core/portable_type/scalar_type.h>

namespace rnexecutorch {

using namespace ::executorch::extension;
using namespace ::executorch::aten;

std::pair<TensorPtr, std::vector<int32_t>>
MoonshineStrategy::prepareAudioInput(std::span<float> waveform) {
  std::vector<int32_t> inputShape = {1, static_cast<int32_t>(waveform.size())};
  auto tensorPtr =
      make_tensor_ptr(inputShape, waveform.data(), ScalarType::Float);
  return {tensorPtr, inputShape};
}

TensorPtr
MoonshineStrategy::prepareTokenInput(const std::vector<int64_t> &prevTokens) {
  std::vector<int32_t> tensorSizes = {1,
                                      static_cast<int32_t>(prevTokens.size())};
  return make_tensor_ptr(tensorSizes, const_cast<int64_t *>(prevTokens.data()),
                         ScalarType::Long);
}

int64_t MoonshineStrategy::extractOutputToken(const void *outputPtr,
                                              std::vector<int32_t> &sizes) {
  size_t innerDim = sizes.at(1);
  const auto *data = static_cast<const int64_t *>(outputPtr);
  return data[innerDim - 1];
}

} // namespace rnexecutorch
