#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch::extensions::cv::image_ops {
/**
 * Installs the `resize` CV operation (stretch, letterbox, crop with
 * interpolation) into the given JSI object.
 *
 * @param rt The active JavaScript runtime.
 * @param module The target object to attach the function to.
 */
void install_resize(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);

/**
 * Installs the `cvtColor` color space conversion function (e.g. RGBA to RGB)
 * into the given JSI object.
 *
 * @param rt The active JavaScript runtime.
 * @param module The target object to attach the function to.
 */
void install_cvtColor(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);

/**
 * Installs the HWC-to-CHW transposition layout helper function
 * `toChannelsFirst` into the given JSI object.
 *
 * @param rt The active JavaScript runtime.
 * @param module The target object to attach the function to.
 */
void install_toChannelsFirst(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);

/**
 * Installs the CHW-to-HWC transposition layout helper function `toChannelsLast`
 * into the given JSI object.
 *
 * @param rt The active JavaScript runtime.
 * @param module The target object to attach the function to.
 */
void install_toChannelsLast(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);

/**
 * Installs the element-wise pixel values scaling and normalization function
 * `normalize` into the given JSI object.
 *
 * @param rt The active JavaScript runtime.
 * @param module The target object to attach the function to.
 */
void install_normalize(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::cv::image_ops
