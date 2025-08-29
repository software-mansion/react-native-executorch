#include "BaseEmbeddings.h"

#include <span>

namespace rnexecutorch::models::embeddings {

BaseEmbeddings::BaseEmbeddings(const std::string &modelSource,
                               std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {}

std::shared_ptr<OwningArrayBuffer>
BaseEmbeddings::postprocess(const Result<std::vector<EValue>> &forwardResult) {
  auto forwardResultTensor = forwardResult->at(0).toTensor();
  auto dataPtr = forwardResultTensor.mutable_data_ptr();
  auto outputNumel = forwardResultTensor.numel();

  std::span<float> modelOutput(static_cast<float *>(dataPtr), outputNumel);

  auto createBuffer = [](const auto &data, size_t size) {
    auto buffer = std::make_shared<OwningArrayBuffer>(size);
    std::memcpy(buffer->data(), data, size);
    return buffer;
  };
  return createBuffer(modelOutput.data(), modelOutput.size_bytes());
}

} // namespace rnexecutorch::models::embeddings
