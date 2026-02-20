#pragma once

#include <string>

namespace rnexecutorch::models::speech_to_text {

struct Word {
  std::string content;
  float start;
  float end;

  std::string punctations =
      ""; // Trailing punctations which appear after the main content
};

} // namespace rnexecutorch::models::speech_to_text
