#pragma once

#include <span>
#include <vector>

namespace rnexecutorch::numerical {
void softmax(std::vector<float> &v);
void normalize(std::span<float> span);
void normalize(std::vector<float> &v);
void normalize(std::span<float> span);
std::vector<float> meanPooling(std::span<const float> modelOutput,
                               std::span<const int64_t> attnMask);
} // namespace rnexecutorch::numerical