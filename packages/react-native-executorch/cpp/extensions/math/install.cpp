#include "install.h"
#include "operations.h"

namespace rnexecutorch::extensions::math {
namespace jsi = facebook::jsi;

void install(jsi::Runtime &rt, jsi::Object &module) {
    jsi::Object myMathModule(rt);

    install_sigmoid(rt, myMathModule);
    install_softmax(rt, myMathModule);
    install_argmax(rt, myMathModule);

    module.setProperty(rt, "math", myMathModule);
}
} // namespace rnexecutorch::extensions::math
