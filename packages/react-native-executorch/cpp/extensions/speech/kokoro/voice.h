#pragma once
#include <jsi/jsi.h>

namespace mylib::extensions::speech::kokoro {
void install_loadVoiceEmbedding(facebook::jsi::Runtime &rt,
                                facebook::jsi::Object &module);
} // namespace mylib::extensions::speech::kokoro
