#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch::core::utils {
/**
 * Installs `getExecuTorchRegisteredBackends()`, returning the names of the
 * ExecuTorch backends compiled into the native binary.
 *
 * @param rt The active JavaScript runtime.
 * @param module The `__rnexecutorch_jsi__` module object to install onto.
 */
void install_getExecuTorchRegisteredBackends(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);

/**
 * Installs the `isEmulator` boolean, reporting whether the app is running on an
 * Android emulator or an iOS simulator. Used to keep development traffic out of
 * anonymous download analytics.
 *
 * @param rt The active JavaScript runtime.
 * @param module The `__rnexecutorch_jsi__` module object to install onto.
 */
void install_isEmulator(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);

/**
 * Installs `qnnHtpArch`, the Hexagon version (`"v69"` … `"v81"`) QNN models
 * must be compiled for on this device, or `undefined` when the device cannot
 * run them: not a known Snapdragon, or the matching skel is not reachable.
 *
 * @param rt The active JavaScript runtime.
 * @param module The `__rnexecutorch_jsi__` module object to install onto.
 */
void install_qnnHtpArch(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::core::utils
