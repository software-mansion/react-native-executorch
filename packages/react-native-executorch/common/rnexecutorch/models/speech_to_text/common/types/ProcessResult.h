#pragma once

#include "Word.h"
#include <string>
#include <vector>

namespace rnexecutorch::models::speech_to_text {

struct ProcessResult {
  std::vector<Word> committed;
  std::vector<Word> nonCommitted;
};

} // namespace rnexecutorch::models::speech_to_text
