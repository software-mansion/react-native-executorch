#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch::extensions::speech::kokoro {
void install_tokenize(facebook::jsi::Runtime &rt,
                      facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::speech::kokoro
