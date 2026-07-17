#include "install.h"
#include "operations.h"

namespace rnexecutorch::extensions::speech {
namespace jsi = facebook::jsi;

void install(jsi::Runtime &rt, jsi::Object &module) {
    jsi::Object speechModule(rt);

    install_extractFrames(rt, speechModule);

    module.setProperty(rt, "speech", speechModule);
}
} // namespace rnexecutorch::extensions::speech
