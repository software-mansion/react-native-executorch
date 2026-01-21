#pragma once

#include <cmath>
#include <fstream>
#include <string>
#include <vector>

namespace test_utils {

inline void trimFilePrefix(std::string &filepath) {
  constexpr std::string_view prefix = "file://";
  if (filepath.starts_with(prefix)) {
    filepath.erase(0, prefix.size());
  }
}

inline std::vector<float> loadAudioFromFile(const std::string &filepath) {
  std::ifstream file(filepath, std::ios::binary | std::ios::ate);
  if (!file.is_open()) {
    return {};
  }

  std::streamsize size = file.tellg();
  file.seekg(0, std::ios::beg);

  size_t numSamples = size / sizeof(float);
  std::vector<float> buffer(numSamples);

  file.read(reinterpret_cast<char *>(buffer.data()), size);
  return buffer;
}

inline std::vector<float> generateSilence(size_t numSamples) {
  return std::vector<float>(numSamples, 0.0f);
}

inline std::vector<float> generateSpeechLikeAudio(size_t numSamples,
                                                  size_t sampleRate = 16000) {
  std::vector<float> waveform(numSamples);
  for (size_t i = 0; i < numSamples; ++i) {
    float t = static_cast<float>(i) / sampleRate;
    waveform[i] = 0.3f * std::sin(2.0f * M_PI * 200.0f * t) +
                  0.2f * std::sin(2.0f * M_PI * 400.0f * t) +
                  0.1f * std::sin(2.0f * M_PI * 800.0f * t);
  }
  return waveform;
}

} // namespace test_utils
