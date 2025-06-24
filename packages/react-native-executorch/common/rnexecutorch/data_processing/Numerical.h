#pragma once

#include <span>
#include <vector>

namespace rnexecutorch::numerical {
void softmax(std::vector<float> &v);
void normalize(std::span<float> span);
} // namespace rnexecutorch::numerical