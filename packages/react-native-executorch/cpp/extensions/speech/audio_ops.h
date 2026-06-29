#pragma once

#include <jsi/jsi.h>

namespace mylib::extensions::speech::audio {
void install_crop(facebook::jsi::Runtime &rt,
                  facebook::jsi::Object &module);
} // namespace mylib::extensions::speech::audio
