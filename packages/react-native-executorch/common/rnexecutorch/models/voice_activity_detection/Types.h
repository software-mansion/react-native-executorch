#pragma once

#include <cstddef>

namespace rnexecutorch::models::voice_activity_detection::types {

struct Segment {
  size_t start;
  size_t end;
};

} // namespace rnexecutorch::models::voice_activity_detection::types