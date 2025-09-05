#pragma once

#include <string>

namespace rnexecutorch::models::speech_to_text::types {

struct Word {
  std::string content;
  float start;
  float end;
};

} // namespace rnexecutorch::models::speech_to_text::types
