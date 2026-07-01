#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch::extensions::speech {
void install(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::speech
