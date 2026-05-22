#pragma once

#include <bit>
#include <cstddef>
#include <cstdint>
namespace rnexecutorch::models::voice_activity_detection::constants {

inline constexpr uint32_t kSampleRate = 16000;
inline constexpr uint32_t kSamplesPerMs = kSampleRate / 1000;
inline constexpr auto kMsToSeconds = 0.001f;
inline constexpr uint32_t kWindowSizeMs = 25;
inline constexpr uint32_t kHopLengthMs = 10;
inline constexpr auto kWindowSize =
    static_cast<uint32_t>(kMsToSeconds * kWindowSizeMs * kSampleRate); // 400
inline constexpr auto kHopLength =
    static_cast<uint32_t>(kMsToSeconds * kHopLengthMs * kSampleRate); // 160
inline constexpr auto kPreemphasisCoeff = 0.97f;
inline constexpr auto kLeftPadding = (kWindowSize - 1) / 2;
inline constexpr auto kRightPadding = kWindowSize / 2;
inline constexpr auto kPaddedWindowSize = std::bit_ceil(kWindowSize); // 512
inline constexpr size_t kModelInputMin = 100;
inline constexpr size_t kModelInputMax = 1000;
inline constexpr auto kSpeechThreshold = 0.6f;
inline constexpr size_t kMinSpeechDuration = 25;                 // 250 ms
inline constexpr size_t kMinSilenceDuration = 10;                // 100 ms
inline constexpr size_t kSpeechPad = 3;                          // 30 ms
inline constexpr size_t kStreamBufferMaxSize = 10 * kSampleRate; // 10s
inline constexpr size_t kStreamBufferMinReserve =
    1 * kSampleRate; // 1s of audio

} // namespace rnexecutorch::models::voice_activity_detection::constants
