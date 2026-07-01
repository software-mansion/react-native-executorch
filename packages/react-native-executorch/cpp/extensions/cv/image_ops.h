#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch::extensions::cv::image_ops {
void install_resize(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
void install_cvtColor(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
void install_toChannelsFirst(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
void install_toChannelsLast(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
void install_normalize(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
void install_applyColormap(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
void install_rotate(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
// Warp `src` through a low-res [-1,1] sampling grid into `dst` (dewarp / remap).
void install_warpByGrid(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
// Perspective-crop an oriented quad of `src` into the `dst` canvas (crop +
// resize-to-height + pad/align).
void install_warpQuad(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::cv::image_ops
