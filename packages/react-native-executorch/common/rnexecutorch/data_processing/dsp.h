#pragma once

#include <span>
#include <vector>

namespace rnexecutorch::dsp {

std::vector<float> hannWindow(int size);
std::vector<float> stftFromWaveform(std::span<float> waveform,
                                    size_t fftWindowSize, size_t hopSize);

} // namespace rnexecutorch::dsp
