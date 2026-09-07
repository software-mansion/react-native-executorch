#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch::extensions::llm {
void install(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::llm
