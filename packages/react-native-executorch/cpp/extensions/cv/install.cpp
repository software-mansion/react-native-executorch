#include "install.h"
#include "image_ops.h"

namespace rnexecutorch::extensions::cv {
namespace jsi = facebook::jsi;

void install(facebook::jsi::Runtime &rt, facebook::jsi::Object &module) {
    jsi::Object myCVModule = jsi::Object(rt);

    image_ops::install_resize(rt, myCVModule);
    image_ops::install_cvtColor(rt, myCVModule);
    image_ops::install_toChannelsFirst(rt, myCVModule);
    image_ops::install_toChannelsLast(rt, myCVModule);
    image_ops::install_normalize(rt, myCVModule);

    module.setProperty(rt, "cv", myCVModule);
}
} // namespace rnexecutorch::extensions::cv
