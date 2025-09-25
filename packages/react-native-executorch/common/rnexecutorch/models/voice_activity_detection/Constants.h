#pragma once

#include <cstddef>
#include <cstdint>

namespace rnexecutorch::models::voice_activity_detection::constants {

inline constexpr uint32_t nextPowerOfTwo(uint32_t n) noexcept {
  if (n <= 1)
    return 1;
  n--;
  n |= n >> 1;
  n |= n >> 2;
  n |= n >> 4;
  n |= n >> 8;
  n |= n >> 16;
  return n + 1;
}

inline constexpr uint32_t kSampleRate = 16000;
inline constexpr float kMstoSecond = 0.001;
inline constexpr uint32_t kWindowSizeMs = 25;
inline constexpr uint32_t kHopLengthMs = 10;
inline constexpr uint32_t kWindowSize =
    static_cast<uint32_t>(kMstoSecond * kWindowSizeMs * kSampleRate); // 400
inline constexpr uint32_t kHopLength =
    static_cast<uint32_t>(kMstoSecond * kHopLengthMs * kSampleRate); // 160
inline constexpr float kPreemphasisCoeff = 0.97f;
inline constexpr uint32_t kLeftPadding = (kWindowSize - 1) / 2;
inline constexpr uint32_t kRightPadding = kWindowSize / 2;
inline constexpr uint32_t kPaddedWindowSize =
    nextPowerOfTwo(kWindowSize); // 512
inline constexpr size_t kModelInputMin = 100;
inline constexpr size_t kModelInputMax = 1000;
inline constexpr float kSpeechThreshold = 0.6;
inline constexpr size_t kMinSpeechDuration = 25;  // 250 ms
inline constexpr size_t kMinSilenceDuration = 10; // 100 ms
inline constexpr size_t kSpeechPad = 3;           // 30 ms

} // namespace rnexecutorch::models::voice_activity_detection::constants