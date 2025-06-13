#pragma once

#include <vector>

namespace rnexecutorch::numerical {
void softmax(std::vector<float> &v);
void normalizeVector(std::vector<float> &v);
} // namespace rnexecutorch::numerical