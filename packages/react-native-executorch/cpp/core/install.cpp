#include "install.h"
#include "model.h"
#include "profiler.h"
#include "tensor.h"
#include "utils.h"

namespace rnexecutorch::core {
void install(facebook::jsi::Runtime &rt, facebook::jsi::Object &module) {
    utils::install_getExecuTorchRegisteredBackends(rt, module);
    utils::install_isEmulator(rt, module);
    model::install_loadModel(rt, module);
    tensor::install_createTensor(rt, module);
    profiler::install_executionProfile(rt, module);
}
} // namespace rnexecutorch::core
