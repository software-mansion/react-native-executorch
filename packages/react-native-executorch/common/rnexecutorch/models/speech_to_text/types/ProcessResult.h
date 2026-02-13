#pragma once

#include <string>

namespace rnexecutorch::models::speech_to_text::types {

struct ProcessResult {
  std::vector<Word> committed;
  std::vector<Word> nonCommitted;
};

} // namespace rnexecutorch::models::speech_to_text::types
