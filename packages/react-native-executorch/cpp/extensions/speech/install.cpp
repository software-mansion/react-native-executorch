#include "install.h"
#include "operations.h"

#ifdef RNE_ENABLE_PHONEMIS
#include "phonemizer.h"
#endif

namespace rnexecutorch::extensions::speech {
namespace jsi = facebook::jsi;

void install(jsi::Runtime &rt, jsi::Object &module) {
    jsi::Object speechModule(rt);

    install_extractFrames(rt, speechModule);
#ifdef RNE_ENABLE_PHONEMIS
    install_createPhonemizer(rt, speechModule);
#endif

    module.setProperty(rt, "speech", speechModule);
}
} // namespace rnexecutorch::extensions::speech
