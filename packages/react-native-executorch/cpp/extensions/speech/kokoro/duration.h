#pragma once
#include <jsi/jsi.h>

namespace mylib::extensions::speech::kokoro {
void install_sumDurations(facebook::jsi::Runtime &rt,
                          facebook::jsi::Object &module);
void install_scaleDurations(facebook::jsi::Runtime &rt,
                            facebook::jsi::Object &module);
void install_expandDurations(facebook::jsi::Runtime &rt,
                             facebook::jsi::Object &module);
void install_cropToTimestamp(facebook::jsi::Runtime &rt,
                             facebook::jsi::Object &module);
} // namespace mylib::extensions::speech::kokoro
