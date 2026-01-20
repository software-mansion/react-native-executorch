#pragma once

#include <string>

namespace rnexecutorch::models::speech_to_text::types {

// struct ProcessResult {
//   std::string committed;
//   std::string nonCommitted;
// };

struct ProcessResult {
  std::vector<Word> committed;
  std::vector<Word> nonCommitted;
};

} // namespace rnexecutorch::models::speech_to_text::types
