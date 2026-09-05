#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch::extensions::cv {
void install(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::cv
