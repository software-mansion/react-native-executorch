#include "install.h"
#include "llm_runner.h"

namespace rnexecutorch::extensions::llm {
namespace jsi = facebook::jsi;

void install(facebook::jsi::Runtime &rt, facebook::jsi::Object &module) {
    jsi::Object llmModule = jsi::Object(rt);

    install_createLLMRunner(rt, llmModule);

    module.setProperty(rt, "llm", llmModule);
}
} // namespace rnexecutorch::extensions::llm
