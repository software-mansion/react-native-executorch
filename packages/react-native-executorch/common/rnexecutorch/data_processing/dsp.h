#pragma once

#include <span>
#include <vector>

namespace rnexecutorch::dsp {

// Window functions
std::vector<float> hann_window(std::size_t size);

// STFT functionality for speech processing
std::vector<float> stft_magnitude_db(std::span<const float> waveform,
                                     std::size_t fftWindowSize,
                                     std::size_t hopSize);

std::vector<float> stft_magnitude_db_windowed(std::span<const float> waveform,
                                              std::span<const float> window,
                                              std::size_t hopSize);

// Whisper-specific preprocessing (functional wrapper)
std::vector<float> whisper_preprocess(std::span<const float> waveform,
                                      std::size_t fftWindowSize = 512,
                                      std::size_t hopSize = 160);

} // namespace rnexecutorch::dsp