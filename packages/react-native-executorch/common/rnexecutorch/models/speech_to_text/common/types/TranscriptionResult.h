#pragma once
#include "Segment.h"
#include <string>
#include <vector>

namespace rnexecutorch::models::speech_to_text {

struct TranscriptionResult {
  std::string text;
  std::string task;
  std::string language;
  double duration = 0.0;
  std::vector<Segment> segments; // Populated only if verbose=true
};

} // namespace rnexecutorch::models::speech_to_text