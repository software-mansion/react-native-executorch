#include "RnExecutorch.h"

#include "core/install.h"
#include "extensions/cv/install.h"
#include "extensions/math/install.h"

using namespace facebook;

namespace rnexecutorch {
void install(jsi::Runtime &jsiRuntime) {
    jsi::Object module = jsi::Object(jsiRuntime);

    rnexecutorch::core::install(jsiRuntime, module);
    rnexecutorch::extensions::cv::install(jsiRuntime, module);
    rnexecutorch::extensions::math::install(jsiRuntime, module);

    jsiRuntime.global().setProperty(jsiRuntime, "__rnexecutorch_jsi__", std::move(module));
}
} // namespace rnexecutorch
