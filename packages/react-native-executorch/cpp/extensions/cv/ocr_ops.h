#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch::extensions::cv::ocr_ops {
void install_extractCraftTextBoxes(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
void install_extractDbnetTextBoxes(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
void install_ctcGreedyDecode(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::cv::ocr_ops
