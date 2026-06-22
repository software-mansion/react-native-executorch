#include "BaseEmbeddings.h"

namespace rnexecutorch::models::embeddings {

BaseEmbeddings::BaseEmbeddings(const std::string &modelSource,
                               std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {}

} // namespace rnexecutorch::models::embeddings
