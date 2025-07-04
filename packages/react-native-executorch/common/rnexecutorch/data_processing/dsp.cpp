#include <cmath>
#include <complex>
#include <math.h>
#include <memory>
#include <rnexecutorch/data_processing/FFT.h>
#include <rnexecutorch/data_processing/dsp.h>

namespace rnexecutorch::dsp {

/// @brief Generates Hann Window coefficients:
/// https://www.mathworks.com/help/signal/ref/hann.html
std::vector<float> hann_window(std::size_t size) {
  std::vector<float> hann(size);

  for (std::size_t i = 0; i < size; i++) {
    hann[i] = 0.5f * (1.0f - std::cos(2.0f * M_PI * i / (size - 1)));
  }
  return hann;
}

/// @brief Performs Short-Time Fourier Transform (STFT) on audio data to
/// generate a magnitude spectrogram in dB scale.
///
/// @param waveform Input audio waveform
/// @param fftWindowSize The size of each FFT window (number of samples). Must
/// be a power of 2.
/// @param hopSize The number of samples to advance between consecutive windows.
std::vector<float> stft_magnitude_db(std::span<const float> waveform,
                                     std::size_t fftWindowSize,
                                     std::size_t hopSize) {
  auto window = hann_window(fftWindowSize);
  return stft_magnitude_db_windowed(waveform, window, hopSize);
}

/// @brief Performs STFT with a pre-computed window function.
///
/// @param waveform Input audio waveform
/// @param window Pre-computed window function (must be same size as FFT window)
/// @param hopSize The number of samples to advance between consecutive windows.
std::vector<float> stft_magnitude_db_windowed(std::span<const float> waveform,
                                              std::span<const float> window,
                                              std::size_t hopSize) {
  std::size_t fftWindowSize = window.size();
  FFT fftInvoker(fftWindowSize);
  std::vector<float> output;

  std::size_t beginIdx = 0;
  std::vector<std::complex<float>> fftOutBuffer(fftWindowSize);
  std::vector<float> fftInBuffer(fftWindowSize);

  while (beginIdx + fftWindowSize <= waveform.size()) {
    // Apply window function
    for (std::size_t i = 0; i < fftWindowSize; ++i) {
      fftInBuffer[i] = waveform[beginIdx + i] * window[i];
    }

    fftInvoker.doFFT(fftInBuffer.data(), fftOutBuffer);

    // Convert complex output to magnitude in dB
    // Only use first half of FFT output (real signal symmetry)
    for (std::size_t i = 0; i < fftWindowSize / 2; ++i) {
      float magnitude = std::abs(fftOutBuffer[i]);
      float magnitudeDb = 20.0f * std::log10f(magnitude);
      output.push_back(magnitudeDb);
    }

    beginIdx += hopSize;
  }
  return output;
}

/// @brief Whisper-specific preprocessing function.
/// This is a functional wrapper around the STFT functionality with Whisper's
/// default parameters.
///
/// @param waveform Input audio waveform
/// @param fftWindowSize FFT window size (default: 512)
/// @param hopSize Hop size for STFT (default: 160)
std::vector<float> whisper_preprocess(std::span<const float> waveform,
                                      std::size_t fftWindowSize,
                                      std::size_t hopSize) {
  return stft_magnitude_db(waveform, fftWindowSize, hopSize);
}

} // namespace rnexecutorch::dsp