#include "Submodule.h"
#include <rnexecutorch/Error.h>

#include <algorithm>
#include <vector>

namespace rnexecutorch::models::text_to_speech::supertonic {

Submodule::Submodule(const std::string &modelSource,
                     std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker), methodName_("forward") {
  // Each submodule program has a single method whose name matches the model
  // (e.g. "duration_predictor"). Discover it; fall back to "forward".
  auto methods = module_->method_names();
  if (methods.ok() && !methods->empty()) {
    // Prefer a non-generic name if present, else take the only one.
    std::vector<std::string> names(methods->begin(), methods->end());
    std::ranges::sort(names);
    methodName_ = names.front();
    for (const auto &n : names) {
      if (n != "forward") {
        methodName_ = n;
        break;
      }
    }
  }
}

Result<std::vector<EValue>>
Submodule::run(const std::vector<EValue> &inputs) const {
  auto results = execute(methodName_, inputs);
  if (!results.ok()) {
    throw RnExecutorchError(
        RnExecutorchErrorCode::InvalidModelOutput,
        "[Supertonic::Submodule] failed to execute '" + methodName_ +
            "', error: " +
            std::to_string(static_cast<uint32_t>(results.error())));
  }
  return results;
}

} // namespace rnexecutorch::models::text_to_speech::supertonic
