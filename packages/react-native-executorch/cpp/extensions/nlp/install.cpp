#include "install.h"
#include "tokenizer.h"

namespace rnexecutorch::extensions::nlp {
void install(facebook::jsi::Runtime &rt, facebook::jsi::Object &module) {
    tokenizer::install_loadTokenizer(rt, module);
}
} // namespace rnexecutorch::extensions::nlp
