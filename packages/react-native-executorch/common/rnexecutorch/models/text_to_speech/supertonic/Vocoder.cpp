#include "Vocoder.h"

#include <executorch/extension/tensor/tensor.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/metaprogramming/ContainerHelpers.h>

namespace rnexecutorch::models::text_to_speech::supertonic {

using ::executorch::aten::ScalarType;
using ::executorch::extension::make_tensor_ptr;

Vocoder::Vocoder(const std::string &modelSource,
                 std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  auto shapes = getAllInputShapes("forward");
  if (shapes.empty()) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnknownError,
                            "[Supertonic::Vocoder] 'forward' method not found");
  }
  CHECK_SIZE(shapes, 1);
}

std::vector<float> Vocoder::generate(std::span<float> xt, int32_t channels,
                                     int32_t L) const {
  auto xtTensor =
      make_tensor_ptr({1, channels, L}, xt.data(), ScalarType::Float);

  auto results = forward(std::vector<EValue>{xtTensor});
  if (!results.ok()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidModelOutput,
        "[Supertonic::Vocoder] forward failed, error: " +
            std::to_string(static_cast<uint32_t>(results.error())));
  }

  auto wavTensor = results->at(0).toTensor();
  const auto totalSamples = static_cast<size_t>(wavTensor.numel());
  const float *wavPtr = wavTensor.const_data_ptr<float>();

  return {wavPtr, wavPtr + totalSamples};
}

} // namespace rnexecutorch::models::text_to_speech::supertonic
