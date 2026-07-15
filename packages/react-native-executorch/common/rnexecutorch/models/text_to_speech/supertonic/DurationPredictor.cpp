#include "DurationPredictor.h"
#include "Constants.h"

#include <executorch/extension/tensor/tensor.h>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/metaprogramming/ContainerHelpers.h>

namespace rnexecutorch::models::text_to_speech::supertonic {

using ::executorch::aten::ScalarType;
using ::executorch::extension::make_tensor_ptr;

DurationPredictor::DurationPredictor(
    const std::string &modelSource,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  auto shapes = getAllInputShapes("forward");
  if (shapes.empty()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::UnknownError,
        "[Supertonic::DurationPredictor] 'forward' method not found");
  }
  CHECK_SIZE(shapes, 3);
}

float DurationPredictor::generate(std::span<Token> ids, std::span<float> mask,
                                  std::span<float> styleDp, float speed) const {
  const auto tLen = static_cast<int32_t>(ids.size());

  auto idsTensor = make_tensor_ptr({1, tLen}, ids.data(), ScalarType::Long);
  auto maskTensor =
      make_tensor_ptr({1, 1, tLen}, mask.data(), ScalarType::Float);
  auto styleDpTensor =
      make_tensor_ptr({1, constants::kStyleDpTokens, constants::kStyleDpDim},
                      styleDp.data(), ScalarType::Float);

  auto results = forward({idsTensor, styleDpTensor, maskTensor});
  if (!results.ok()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidModelOutput,
        "[Supertonic::DurationPredictor] forward failed, error: " +
            std::to_string(static_cast<uint32_t>(results.error())));
  }

  auto durTensor = results->at(0).toTensor();
  return durTensor.const_data_ptr<float>()[0] / speed;
}

} // namespace rnexecutorch::models::text_to_speech::supertonic
