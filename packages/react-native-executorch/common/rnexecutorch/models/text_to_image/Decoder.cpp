#include "Decoder.h"

#include <cmath>

#include <executorch/extension/tensor/tensor_ptr_maker.h>

namespace rnexecutorch::models::text_to_image {

using namespace executorch::extension;

Decoder::Decoder(const std::string &modelSource,
                 std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {}

std::vector<float> Decoder::generate(std::vector<float> &input) const {
  std::vector<int32_t> inputShape = {1, numChannels, latentImageSize,
                                     latentImageSize};
  auto inputTensor =
      make_tensor_ptr(inputShape, input.data(), ScalarType::Float);

  auto forwardResult = BaseModel::forward(inputTensor);
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Function forward in decoder failed with error code: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }

  auto forwardResultTensor = forwardResult->at(0).toTensor();
  const auto *dataPtr = forwardResultTensor.const_data_ptr<float>();
  return {dataPtr, dataPtr + forwardResultTensor.numel()};
}
} // namespace rnexecutorch::models::text_to_image
