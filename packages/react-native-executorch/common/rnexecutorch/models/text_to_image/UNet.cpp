#include "UNet.h"

#include <rnexecutorch/data_processing/Numerical.h>
#include <executorch/extension/tensor/tensor_ptr_maker.h>
#include <rnexecutorch/Log.h>

namespace rnexecutorch::models::text_to_image {

using namespace executorch::extension;

UNet::UNet(const std::string &modelSource,
            int modelImageSize, int numChannels,
            std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker),
    modelImageSize(modelImageSize), numChannels(numChannels) {}

std::vector<float> UNet::generate(const std::vector<float> & latents, int timestep, const std::vector<float> & embeddings) {
  int latentsImageSize = std::floor(modelImageSize / 8);
  std::vector<int32_t> latentsShape = {2, numChannels, latentsImageSize, latentsImageSize};
  std::vector<int32_t> timestepShape = {1};
  std::vector<int32_t> embeddingsShape = {2, 77, 768};
  log(LOG_LEVEL::Info, latentsShape[1], timestepShape[0], embeddingsShape[1]);

  std::vector<uint8_t> latentsBytes(
    reinterpret_cast<const uint8_t*>(latents.data()),
    reinterpret_cast<const uint8_t*>(latents.data()) + latents.size() * sizeof(float));

  std::vector<uint8_t> timestepBytes(
    reinterpret_cast<const uint8_t*>(&timestep),
    reinterpret_cast<const uint8_t*>(&timestep) + sizeof(int64_t));

  std::vector<uint8_t> embeddingsBytes(
    reinterpret_cast<const uint8_t*>(embeddings.data()),
    reinterpret_cast<const uint8_t*>(embeddings.data()) + embeddings.size() * sizeof(float));

  auto latentsTensor = make_tensor_ptr(latentsShape, latentsBytes, ScalarType::Float);
  auto timestepTensor = make_tensor_ptr(timestepShape, timestepBytes, ScalarType::Long);
  auto embeddingsTensor = make_tensor_ptr(embeddingsShape, embeddingsBytes, ScalarType::Float);
  log(LOG_LEVEL::Info, latentsTensor->sizes(), timestepTensor->sizes(), embeddingsTensor->sizes());

  auto forwardResult = BaseModel::forward({latentsTensor, timestepTensor, embeddingsTensor});
  if (!forwardResult.ok()) {
    log(LOG_LEVEL::Info, "Error:", forwardResult.error());
    throw std::runtime_error(
        "Function forward in UNet failed with error code: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }

  auto forwardResultTensor = forwardResult->at(0).toTensor();
  auto dataPtr = static_cast<const float*>(forwardResultTensor.const_data_ptr());
  int dataSize = forwardResultTensor.numel();
  return std::vector<float>(dataPtr, dataPtr + dataSize);
}
} // namespace rnexecutorch::models::text_to_image
