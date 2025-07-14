#include <cstddef>
#include <math.h>
#include <rnexecutorch/data_processing/FFT.h>
#include <rnexecutorch/data_processing/dsp.h>

namespace rnexecutorch::dsp {

using namespace rnexecutorch::dsp;

std::vector<float> hannWindow(int size) {
  // https://www.mathworks.com/help/signal/ref/hann.html
  std::vector<float> window(size);
  for (int i = 0; i < size; i++) {
    window[i] = 0.5f * (1 - std::cos(2 * M_PI * i / size));
  }
  return window;
}

std::vector<float> stftFromWaveform(std::span<float> waveform,
                                    size_t fftWindowSize, size_t hopSize) {
  // Initialize FFT
  FFT fft(fftWindowSize);

  size_t numFrames = 1 + (waveform.size() - fftWindowSize) / hopSize;
  int numBins = fftWindowSize / 2;
  auto hann = hannWindow(fftWindowSize);
  auto inBuffer = std::vector<float>(fftWindowSize);
  auto outBuffer = std::vector<std::complex<float>>(fftWindowSize);

  // Output magnitudes in dB
  std::vector<float> magnitudes;
  magnitudes.reserve(numFrames * numBins);
  const float magnitudeScale = 1.0f / fftWindowSize;
  const float epsilon = 1e-10f;

  for (size_t t = 0; t < numFrames; ++t) {
    size_t offset = t * hopSize;

    // Clear the input buffer first
    std::fill(inBuffer.begin(), inBuffer.end(), 0.0f);

    // Fill frame with windowed signal
    size_t samplesToRead = std::min(fftWindowSize, waveform.size() - offset);
    for (size_t i = 0; i < samplesToRead; i++) {
      inBuffer[i] = waveform[offset + i] * hann[i];
    }
    // Perform FFT using the FFT class
    fft.doFFT(inBuffer.data(), outBuffer);

    // Calculate magnitudes in dB (only positive frequencies)
    for (int i = 0; i < numBins; i++) {
      float magnitude = std::abs(outBuffer[i]) * magnitudeScale;
      float magnitude_db = 20.0f * log10f(magnitude + epsilon);
      magnitudes.push_back(magnitude_db);
    }
  }

  return magnitudes;
}

} // namespace rnexecutorch::dsp
