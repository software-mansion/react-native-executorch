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

int64_t MoonshineStrategy::extractOutputToken(const void *outputPtr,
                                              size_t innerDim) const {
  const auto *data = static_cast<const int64_t *>(outputPtr);
  return data[innerDim - 1];
}

} // namespace rnexecutorch
