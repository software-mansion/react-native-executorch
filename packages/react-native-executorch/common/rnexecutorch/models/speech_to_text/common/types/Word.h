#pragma once

#include <string>

namespace rnexecutorch::models::speech_to_text {

/**
 * Basically a different representation of token,
 * with timestamps calculated.
 */
struct Word {
  std::string content;
  float start;
  float end;
};

} // namespace rnexecutorch::models::speech_to_text
