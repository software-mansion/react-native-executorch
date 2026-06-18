#include "RnExecutorch.h"

#include "core/install.h"

using namespace facebook;

namespace rnexecutorch {
void install(jsi::Runtime &jsiRuntime) {
    jsi::Object module = jsi::Object(jsiRuntime);

    rnexecutorch::core::install(jsiRuntime, module);

    jsiRuntime.global().setProperty(jsiRuntime, "__rnexecutorch_jsi__", std::move(module));
}
} // namespace rnexecutorch
