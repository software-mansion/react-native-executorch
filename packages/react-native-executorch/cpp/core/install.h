#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch::core {
void install(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::core
