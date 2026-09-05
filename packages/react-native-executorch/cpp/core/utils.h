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
} // namespace rnexecutorch::core::utils
