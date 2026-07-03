#pragma once

#include <memory>
#include <string>
#include <vector>

#include <executorch/extension/tensor/tensor.h>

#include <rnexecutorch/models/BaseModel.h>

namespace rnexecutorch::models::text_to_speech::supertonic {

using executorch::runtime::EValue;
using executorch::runtime::Result;

/**
 * A thin wrapper around a single exported ``.pte`` submodule.
 *
 * Each Supertonic submodule (duration_predictor, text_encoder,
 * vector_estimator, vocoder) is exported as its own program with exactly one
 * method (see scripts/export/export_xnnpack.py). This class discovers that
 * method's name at construction and exposes a plain ``run``. The orchestrator
 * (Supertonic) owns four of these and builds the tensors for each call, so the
 * model-specific I/O logic lives in one place.
 */
class Submodule : public BaseModel {
public:
  Submodule(const std::string &modelSource,
            std::shared_ptr<react::CallInvoker> callInvoker);

  // Runs the (single) forward method with the given input EValues.
  Result<std::vector<EValue>> run(const std::vector<EValue> &inputs) const;

  const std::string &methodName() const noexcept { return methodName_; }

private:
  std::string methodName_;
};

} // namespace rnexecutorch::models::text_to_speech::supertonic
