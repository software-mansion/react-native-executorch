#pragma once

#include <jsi/jsi.h>

namespace rnexecutorch::extensions::llm {
/**
 * Installs all LLM extension host functions and objects onto the target JSI module.
 *
 * @param rt The JSI runtime instance.
 * @param module The root `rnexecutorchJsi` module object.
 */
void install(facebook::jsi::Runtime &rt, facebook::jsi::Object &module);
} // namespace rnexecutorch::extensions::llm
