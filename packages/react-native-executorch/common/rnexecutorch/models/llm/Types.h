#pragma once

#include <string>
#include <vector>

namespace rnexecutorch::models::llm {
struct MultimodalInputs {
  std::vector<std::string> imagePaths;
  std::string imageToken;
  std::vector<std::vector<float>> audioWaveforms;
  std::string audioToken;
};
using Token = uint64_t;

} // namespace rnexecutorch::models::llm