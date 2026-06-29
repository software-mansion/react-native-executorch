#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch::extensions::cv::ocr_ops {
// Detector heatmap -> flat array of oriented quads (10 doubles/box:
// x0,y0..x3,y3,score,angle), in detector-input pixels.
void install_extractTextBoxes(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);

// Perspective-crop an oriented quad of `src` into the recognizer canvas `dst`
// (crop + resize-to-height + bucket-pad), HWC uint8.
void install_warpQuad(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);

// Per-timestep argmax + max value over [..,T,V] logits -> flat [idx,prob,...];
// options.softmax makes `prob` a probability.
void install_ctcGreedyDecode(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::cv::ocr_ops
