#pragma once

#include <cstddef>
#include <rnexecutorch/data_processing/FFT.h>
#include <span>
#include <vector>

namespace rnexecutorch::preprocessors {
using namespace rnexecutorch::dsp;

class WhisperPreprocessor {
  explicit WhisperPreprocessor(std::size_t fftWindowSize) noexcept;

public:
  std::vector<float> preprocess(std::span<float> waveform, std::size_t hopSize);

private:
  std::vector<float> hannWindow;
  FFT fftInvoker;
  std::size_t fftWindowSize;
  std::size_t fftHopSize;
};
} // namespace rnexecutorch::preprocessors
