#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch::extensions::speech::audio {
void install_crop(facebook::jsi::Runtime &rt,
                  facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::speech::audio
