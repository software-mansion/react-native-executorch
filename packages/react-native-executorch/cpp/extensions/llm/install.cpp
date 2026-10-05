#include "install.h"
#include "sampler.h"

namespace rnexecutorch::extensions::llm {
namespace jsi = facebook::jsi;

void install(jsi::Runtime &rt, jsi::Object &module) {
    jsi::Object llmModule(rt);

    install_sample(rt, llmModule);

    module.setProperty(rt, "llm", llmModule);
}
} // namespace rnexecutorch::extensions::llm
