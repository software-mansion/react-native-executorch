#include "Decoder.h"

#include <executorch/extension/tensor/tensor_ptr_maker.h>

namespace rnexecutorch::models::text_to_image {

using namespace executorch::extension;

Decoder::Decoder(const std::string &modelSource, int modelImageSize,
                 int numChannels,
                 std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker), modelImageSize(modelImageSize),
      numChannels(numChannels) {}

std::vector<float> Decoder::generate(const std::vector<float> &input) {
  int latentsImageSize = std::floor(modelImageSize / 8);
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
  auto dataPtr =
      static_cast<const float *>(forwardResultTensor.const_data_ptr());
  int dataSize = forwardResultTensor.numel();
  return std::vector<float>(dataPtr, dataPtr + dataSize);
}
} // namespace rnexecutorch::models::text_to_image
