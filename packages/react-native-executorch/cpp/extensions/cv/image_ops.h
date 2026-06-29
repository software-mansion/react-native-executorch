#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch::extensions::cv::image_ops {
void install_resize(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
void install_cvtColor(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
void install_toChannelsFirst(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
void install_toChannelsLast(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
void install_normalize(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
void install_applyColormap(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
void install_gridSample(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::cv::image_ops
