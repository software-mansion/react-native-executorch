#pragma once

#include <optional>
#include <string>

#include <jsi/jsi.h>

#include <executorch/runtime/executor/method_meta.h>

namespace rnexecutorch::core::utils {
/**
 * Explains a method load failure caused by its backends, which ExecuTorch
 * reports only as a bare error code: a backend this binary was not built with,
 * or Core ML / MLX on a simulator, which cannot run them.
 *
 * @param methodMeta Metadata of the method that failed to load.
 * @return What went wrong and what to do instead, or `std::nullopt` when the
 * method's backends do not explain the failure.
 */
std::optional<std::string> diagnoseBackends(const executorch::runtime::MethodMeta &methodMeta);

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
