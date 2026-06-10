#pragma once

#include <optional>
#include <string>
#include <vector>

namespace rnexecutorch::models::llm {
struct ImageInputs {
  std::vector<std::string> paths;
  std::string token;
};

struct AudioInputs {
  std::vector<std::vector<float>> waveforms;
  std::string token;
};

struct MultimodalInputs {
  std::optional<ImageInputs> images;
  std::optional<AudioInputs> audios;
};

} // namespace rnexecutorch::models::llm
