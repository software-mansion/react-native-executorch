#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch::extensions::cv::ocr_ops {
// CRAFT half-res region+affinity heatmap [..,Hd,Wd,2] -> flat array of oriented
// quads (10 doubles/box: x0,y0..x3,y3,score,angle), in detector-input pixels.
void install_extractCraftTextBoxes(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);

// DBNet full-res probability map [..,H,W] -> flat array of oriented quads (10
// doubles/box), in detector-input pixels.
void install_extractDbnetTextBoxes(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);

// Per-timestep argmax + max value over [..,T,V] logits -> flat [idx,value,...].
// `value` is the raw max activation; softmax the tensor beforehand if a caller
// needs a probability.
void install_ctcGreedyDecode(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::cv::ocr_ops
