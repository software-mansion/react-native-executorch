#include "Decoder.h"

#include <executorch/extension/tensor/tensor_ptr_maker.h>

namespace rnexecutorch::models::text_to_image {

using namespace executorch::extension;

Decoder::Decoder(const std::string &modelSource, int32_t modelImageSize,
                 int32_t numChannels,
                 std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker), modelImageSize(modelImageSize),
      numChannels(numChannels) {}

std::vector<float> Decoder::generate(const std::vector<float> &input) {
  // Divide by 8 to account for the 3 down-sampling layers in the VAE model.
  int32_t latentsImageSize = std::floor(modelImageSize / 8);
  std::vector<int32_t> inputShape = {1, numChannels, latentsImageSize,
                                     latentsImageSize};

  std::vector<uint8_t> inputBytes(
      reinterpret_cast<const uint8_t *>(input.data()),
      reinterpret_cast<const uint8_t *>(input.data()) +
          input.size() * sizeof(float));

  auto inputTensor = make_tensor_ptr(inputShape, inputBytes, ScalarType::Float);

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
