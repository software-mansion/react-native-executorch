#include <algorithm>
#include <cstddef>
#include <limits>
#include <math.h>
#include <rnexecutorch/data_processing/FFT.h>
#include <rnexecutorch/data_processing/dsp.h>

namespace rnexecutorch::dsp {

using namespace rnexecutorch::dsp;

std::vector<float> hannWindow(size_t size) {
  // https://www.mathworks.com/help/signal/ref/hann.html
  std::vector<float> window(size);
  for (size_t i = 0; i < size; i++) {
    window[i] = 0.5f * (1 - std::cos(2 * M_PI * i / size));
  }
  return window;
}

std::vector<float> stftFromWaveform(std::span<const float> waveform,
                                    size_t fftWindowSize, size_t hopSize) {
  // Initialize FFT
  FFT fft(fftWindowSize);

  const auto numFrames = 1 + (waveform.size() - fftWindowSize) / hopSize;
  const auto numBins = fftWindowSize / 2;
  const auto hann = hannWindow(fftWindowSize);
  auto inBuffer = std::vector<float>(fftWindowSize);
  auto outBuffer = std::vector<std::complex<float>>(fftWindowSize);

  // Output magnitudes in dB
  std::vector<float> magnitudes;
  magnitudes.reserve(numFrames * numBins);
  const auto magnitudeScale = 1.0f / static_cast<float>(fftWindowSize);
  constexpr auto epsilon = std::numeric_limits<float>::epsilon();
  constexpr auto dbConversionFactor = 20.0f;

  for (size_t t = 0; t < numFrames; ++t) {
    const size_t offset = t * hopSize;
    // Clear the input buffer first
    std::ranges::fill(inBuffer, 0.0f);

    // Fill frame with windowed signal
    const size_t samplesToRead =
        std::min(fftWindowSize, waveform.size() - offset);
    for (size_t i = 0; i < samplesToRead; i++) {
      inBuffer[i] = waveform[offset + i] * hann[i];
    }

    fft.doFFT(inBuffer.data(), outBuffer);

    // Calculate magnitudes in dB (only positive frequencies)
    for (size_t i = 0; i < numBins; i++) {
      const auto magnitude = std::abs(outBuffer[i]) * magnitudeScale;
      const auto magnitude_db =
          dbConversionFactor * log10f(magnitude + epsilon);
      magnitudes.push_back(magnitude_db);
    }
  }

  return magnitudes;
}

} // namespace rnexecutorch::dsp
