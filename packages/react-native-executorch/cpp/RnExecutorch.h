#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch {
/**
 * Main entrypoint to install the `rnexecutorch` native JSI bindings into the
 * global JavaScript object context.
 *
 * This injects the `__rnexecutorch_jsi__` global variable containing core
 * model/tensor management APIs and the namespaces for native extensions.
 *
 * @param jsiRuntime The active JavaScript runtime.
 */
void install(facebook::jsi::Runtime &jsiRuntime);
} // namespace rnexecutorch
