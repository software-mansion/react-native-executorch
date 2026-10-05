#include "install.h"
#include "sampler.h"

namespace rnexecutorch::extensions::llm {
namespace jsi = facebook::jsi;

void install(facebook::jsi::Runtime &rt, facebook::jsi::Object &module) {
    jsi::Object llmModule = jsi::Object(rt);

    install_sample(rt, llmModule);

    module.setProperty(rt, "llm", llmModule);
}
} // namespace rnexecutorch::extensions::llm
