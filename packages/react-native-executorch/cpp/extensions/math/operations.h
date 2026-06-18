#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch::extensions::math {
void install_sigmoid(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
void install_softmax(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
void install_argmax(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::math
