#pragma once

#include <cstdint>
#include <string>

#include <jsi/jsi.h>

namespace rnexecutorch::core::profiler {
/**
 * Adds one `execute` call to the totals of a model's method.
 *
 * @param modelPath Path of the `.pte` the method belongs to.
 * @param methodName The exported method that ran.
 * @param nanos How long the call took.
 */
void record(const std::string &modelPath, const std::string &methodName, int64_t nanos);

void install_profiler(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::core::profiler
