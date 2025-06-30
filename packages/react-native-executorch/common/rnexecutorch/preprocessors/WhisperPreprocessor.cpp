#include <rnexecutorch/data_processing/dsp.h>
#include <rnexecutorch/preprocessors/WhisperPreprocessor.h>

namespace rnexecutorch::preprocessors {
using namespace rnexecutorch::dsp;

WhisperPreprocessor::WhisperPreprocessor(std::size_t fftWindowSize)
    : fftWindowSize(fftWindowSize), fftInvoker(fftWindowSize),
      hannWindow(hann_window(fftWindowSize)) {}

/// @brief Performs Short-Time Fourier Transform (STFT) on audio data to
/// generate a spectrogram.
///
/// The STFT divides the audio signal into overlapping windows and computes the
/// FFT for each window. This creates a time-frequency representation suitable
/// for speech recognition models like Whisper.
///
/// @param fftWindowSize The size of each FFT window (number of samples). Must
/// be a power of 2.
/// @param fftHopSize The number of samples to advance between consecutive
/// windows.
///                   Overlap between windows = fftWindowSize - fftHopSize.
///                   Smaller hop size = more overlap = better time resolution.
std::vector<float> WhisperPreprocessor::preprocess(std::span<float> waveform,
                                                   std::size_t hopSize) {
  std::vector<float> output;
  size_t beginIdx = 0;
  std::vector<std::complex<float>> fftOutBuffer(fftWindowSize);
  std::vector<float> fftInBuffer(fftWindowSize);

  while (beginIdx + fftWindowSize <= waveform.size()) {

    // Assign values to signal and apply hann window
    for (size_t i = 0; i < fftWindowSize; ++i) {
      fftInBuffer[i] = waveform[beginIdx + i] * hannWindow[i];
    }
    fftInvoker.doFFT(fftInBuffer.data(), fftOutBuffer);

    // Convert complex output to magnitude in dB (matching SFFT.mm)
    // Only use first half of FFT output (real signal symmetry)
    for (size_t i = 0; i < fftWindowSize / 2; ++i) {
      float magnitude = std::abs(fftOutBuffer[i]);
      float magnitudeDb = 20.0f * std::log10f(magnitude);
      output.push_back(magnitudeDb);
    }

    beginIdx += hopSize;
  }
  return output;
}
} // namespace rnexecutorch::preprocessors