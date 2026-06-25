#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch::extensions::cv::box_ops {
void install_nms(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::cv::box_ops
