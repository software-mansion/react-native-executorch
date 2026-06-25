#include "RnExecutorch.h"

#include "core/install.h"
#include "extensions/math/install.h"
#include "extensions/nlp/install.h"

// The cv extension links against OpenCV. When opencv is opted out
// (RNE_ENABLE_OPENCV unset by the build config), its sources are excluded from
// compilation, so guard the include + install call too.
#ifdef RNE_ENABLE_OPENCV
#include "extensions/cv/install.h"
#endif

using namespace facebook;

namespace rnexecutorch {
void install(jsi::Runtime &jsiRuntime) {
    jsi::Object module = jsi::Object(jsiRuntime);

    rnexecutorch::core::install(jsiRuntime, module);
#ifdef RNE_ENABLE_OPENCV
    rnexecutorch::extensions::cv::install(jsiRuntime, module);
#endif
    rnexecutorch::extensions::math::install(jsiRuntime, module);
    rnexecutorch::extensions::nlp::install(jsiRuntime, module);

    jsiRuntime.global().setProperty(jsiRuntime, "__rnexecutorch_jsi__", std::move(module));
}
} // namespace rnexecutorch
