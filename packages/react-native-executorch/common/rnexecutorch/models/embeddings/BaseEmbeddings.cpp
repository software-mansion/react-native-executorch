#include "BaseEmbeddings.h"

#include <span>

namespace rnexecutorch::models::embeddings {

BaseEmbeddings::BaseEmbeddings(const std::string &modelSource,
                               std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {}

std::shared_ptr<OwningArrayBuffer>
BaseEmbeddings::postprocess(const Result<std::vector<EValue>> &forwardResult) {
  auto forwardResultTensor = forwardResult->at(0).toTensor();
  auto buffer = std::make_shared<OwningArrayBuffer>(
      forwardResultTensor.const_data_ptr(), forwardResultTensor.nbytes());
  return buffer;
}

} // namespace rnexecutorch::models::embeddings
