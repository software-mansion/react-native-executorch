#pragma once

#include "Types.h"
#include <vector>

namespace rnexecutorch::models::object_detection::utils {
float intersectionOverUnion(const types::Detection &a,
                            const types::Detection &b);
std::vector<types::Detection>
nonMaxSuppression(std::vector<types::Detection> detections);
} // namespace rnexecutorch::models::object_detection::utils