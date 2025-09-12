#include "UNet.h"

#include <executorch/extension/tensor/tensor_ptr_maker.h>

namespace rnexecutorch::models::text_to_image {

using namespace executorch::extension;

UNet::UNet(const std::string &modelSource, int32_t modelImageSize,
           int32_t numChannels, std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker), numChannels(numChannels) {
  constexpr int32_t latentDownsample = 8;
  latentsSize = std::floor(modelImageSize / latentDownsample);
}

std::vector<float> UNet::generate(std::vector<float> &latents, int32_t timestep,
                                  std::vector<float> &embeddings) const {
  std::vector<float> latentsConcat;
  latentsConcat.reserve(2 * latentsSize);
  latentsConcat.insert(latentsConcat.end(), latents.begin(), latents.end());
  latentsConcat.insert(latentsConcat.end(), latents.begin(), latents.end());

  std::vector<int32_t> latentsShape = {2, numChannels, latentsSize,
                                       latentsSize};
  std::vector<int32_t> timestepShape = {1};
  std::vector<int32_t> embeddingsShape = {2, 77, 768};

  std::vector<int64_t> timestepData = {static_cast<int64_t>(timestep)};
  auto timestepTensor =
      make_tensor_ptr(timestepShape, timestepData.data(), ScalarType::Long);

  auto latentsTensor =
      make_tensor_ptr(latentsShape, latentsConcat.data(), ScalarType::Float);
  auto embeddingsTensor =
      make_tensor_ptr(embeddingsShape, embeddings.data(), ScalarType::Float);

  auto forwardResult =
      BaseModel::forward({latentsTensor, timestepTensor, embeddingsTensor});
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Function forward in UNet failed with error code: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }

  auto forwardResultTensor = forwardResult->at(0).toTensor();
  const auto *dataPtr = forwardResultTensor.const_data_ptr<float>();
  return {dataPtr, dataPtr + forwardResultTensor.numel()};
}
} // namespace rnexecutorch::models::text_to_image
