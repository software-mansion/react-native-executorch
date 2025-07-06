#pragma once

#include <span>
#include <vector>

namespace rnexecutorch::numerical {
template <typename Container> void softmax(Container &input);
template <typename Container> void normalize(Container &input);
std::vector<float> meanPooling(std::span<const float> modelOutput,
                               std::span<const int64_t> attnMask);
} // namespace rnexecutorch::numerical