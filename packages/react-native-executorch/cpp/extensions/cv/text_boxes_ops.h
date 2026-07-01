#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch::extensions::cv::text_boxes_ops {
void install_gridSample(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
void install_warpQuad(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::cv::text_boxes_ops
