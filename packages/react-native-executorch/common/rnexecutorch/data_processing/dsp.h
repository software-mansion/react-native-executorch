#pragma once

#include <span>
#include <vector>

namespace rnexecutorch::dsp {
std::vector<float> hann_window(std::size_t size);
} // namespace rnexecutorch::dsp