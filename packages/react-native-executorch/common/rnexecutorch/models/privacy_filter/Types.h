#pragma once

#include <cstdint>
#include <string>

namespace rnexecutorch::models::privacy_filter::types {

struct PiiEntity {
  std::string label;
  std::string text;
  int32_t startToken;
  int32_t endToken;
};

} // namespace rnexecutorch::models::privacy_filter::types
