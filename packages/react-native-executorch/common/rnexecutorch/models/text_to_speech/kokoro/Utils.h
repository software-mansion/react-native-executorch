#pragma once

#include "Types.h"
#include <span>
#include <string>
#include <vector>

namespace rnexecutorch::models::text_to_speech::kokoro::utils {

// Removes silence from the beginning and the end of an audio (with some
// margin). Returns the audio with minimized length.
std::span<const float> stripAudio(std::span<const float> audio,
                                  size_t margin = 0);

} // namespace rnexecutorch::models::text_to_speech::kokoro::utils