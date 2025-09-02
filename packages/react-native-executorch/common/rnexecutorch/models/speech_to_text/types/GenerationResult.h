#pragma once

#include <vector>

struct GenerationResult {
  std::vector<int32_t> tokens;
  std::vector<float> scores;
};
