#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch::core::utils {
void install_getExecuTorchRegisteredBackends(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::core::utils
