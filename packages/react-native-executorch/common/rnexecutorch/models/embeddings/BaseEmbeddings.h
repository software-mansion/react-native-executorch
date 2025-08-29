#pragma once

#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch::models::embeddings {

class BaseEmbeddings : public BaseModel {
public:
  BaseEmbeddings(const std::string &modelSource,
                 std::shared_ptr<react::CallInvoker> callInvoker);

protected:
  std::shared_ptr<OwningArrayBuffer>
  postprocess(const Result<std::vector<EValue>> &forwardResult);
};

}; // namespace rnexecutorch::models::embeddings
