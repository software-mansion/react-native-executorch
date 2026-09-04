#pragma once

#include <cstdint>
#include <string>

#include <jsi/jsi.h>

namespace rnexecutorch::core::profiler {
/**
 * Records the time one `execute` call spent inside ExecuTorch.
 *
 * Called unconditionally from `Model::execute`, which already brackets the
 * call with two clock reads. The cost is one map lookup and two integer adds
 * per inference, which is nothing beside a forward pass.
 *
 * @param methodName The exported method that ran.
 * @param nanos How long `etModule_->execute` took.
 */
void record(const std::string &methodName, int64_t nanos);

/**
 * Installs `getExecutionProfile()` and `resetExecutionProfile()`.
 *
 * These exist because a task pipeline owns its `Model` privately, so a caller
 * timing a pipeline has no handle to ask. Attributing time to ExecuTorch by
 * re-running the model separately does not work either: a pipeline feeds the
 * shapes its input needs, while a standalone run has to guess them, and for a
 * model with a dynamic dimension the two are not the same work. A benchmark
 * that compares them ends up dividing a 510-token forward by a 75-token
 * pipeline. Accumulating in place removes the guess.
 *
 * @param rt The active JavaScript runtime.
 * @param module The `__rnexecutorch_jsi__` module object to install onto.
 */
void install_executionProfile(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::core::profiler
