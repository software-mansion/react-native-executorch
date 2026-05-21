#pragma once

#include <string>

namespace rnexecutorch::models::speech_to_text {

/**
 * Different representation of a token,
 * with timestamps calculated.
 */
struct Word {
  std::string content;
  float start;
  float end;
};

} // namespace rnexecutorch::models::speech_to_text
