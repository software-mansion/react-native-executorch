#include "install.h"
#include "operations.h"

namespace rnexecutorch::extensions::math {
namespace jsi = facebook::jsi;

void install(jsi::Runtime &rt, jsi::Object &module) {
    jsi::Object mathModule(rt);

    install_sigmoid(rt, mathModule);
    install_softmax(rt, mathModule);
    install_argmax(rt, mathModule);
    install_threshold(rt, mathModule);

    module.setProperty(rt, "math", mathModule);
}
} // namespace rnexecutorch::extensions::math
