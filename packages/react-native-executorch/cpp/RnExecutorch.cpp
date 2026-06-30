#include "RnExecutorch.h"

#include "core/install.h"
#include "extensions/math/install.h"
#include "extensions/nlp/install.h"
#include "extensions/speech/install.h"

#ifdef RNE_ENABLE_OPENCV
#include "extensions/cv/install.h"
#endif

namespace jsi = facebook::jsi;

namespace rnexecutorch {
void install(jsi::Runtime &jsiRuntime) {
    jsi::Object module = jsi::Object(jsiRuntime);

    rnexecutorch::core::install(jsiRuntime, module);
#ifdef RNE_ENABLE_OPENCV
    rnexecutorch::extensions::cv::install(jsiRuntime, module);
#endif
    rnexecutorch::extensions::math::install(jsiRuntime, module);
    rnexecutorch::extensions::nlp::install(jsiRuntime, module);
    rnexecutorch::extensions::speech::install(jsiRuntime, module);

    jsiRuntime.global().setProperty(jsiRuntime, "__rnexecutorch_jsi__", std::move(module));
}
} // namespace rnexecutorch
