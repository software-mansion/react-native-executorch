#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch::extensions::math {
/**
 * Installs the element-wise `sigmoid` activation function into the given JSI
 * object.
 *
 * @param rt The active JavaScript runtime.
 * @param module The target object to attach the function to.
 */
void install_sigmoid(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);

/**
 * Installs the `softmax` activation function (computed along a specified axis)
 * into the given JSI object.
 *
 * @param rt The active JavaScript runtime.
 * @param module The target object to attach the function to.
 */
void install_softmax(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);

/**
 * Installs the index-of-maximum `argmax` function (along a specified axis) into
 * the given JSI object.
 *
 * @param rt The active JavaScript runtime.
 * @param module The target object to attach the function to.
 */
void install_argmax(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::math
