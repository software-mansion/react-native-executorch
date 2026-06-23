#include "install.h"
#include "tokenizer.h"

namespace rnexecutorch::extensions::nlp {
namespace jsi = facebook::jsi;

void install(facebook::jsi::Runtime &rt, facebook::jsi::Object &module) {
    jsi::Object nlpModule = jsi::Object(rt);

    tokenizer::install_loadTokenizer(rt, nlpModule);

    module.setProperty(rt, "nlp", nlpModule);
}
} // namespace rnexecutorch::extensions::nlp
