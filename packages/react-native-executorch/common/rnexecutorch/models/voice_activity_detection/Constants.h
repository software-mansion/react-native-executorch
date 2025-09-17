#pragma once
#include "rnexecutorch/models/voice_activity_detection/Utils.h"

#include <cstdint>

namespace rnexecutorch::models::voice_activity_detection::constants {

constexpr uint32_t kSampleRate = 16000;
constexpr float kMstoSecond = 0.001;
constexpr uint32_t kWindowSizeMs = 25;
constexpr uint32_t kHopLengthMs = 10;
constexpr uint32_t kWindowSize =
    static_cast<uint32_t>(kMstoSecond * kWindowSizeMs * kSampleRate); // 400
constexpr uint32_t kHopLength =
    static_cast<uint32_t>(kMstoSecond * kHopLengthMs * kSampleRate); // 160
constexpr float kPreemphasisCoeff = 0.97f;
constexpr uint32_t kLeftPadding = (kWindowSize - 1) / 2;
constexpr uint32_t kRightPadding = kWindowSize / 2;
constexpr uint32_t kPaddedWindowSize =
    utils::nextPowerOfTwo(kWindowSize); // 512
constexpr size_t kModelInputMin = 100;
constexpr size_t kModelInputMax = 1000;

constexpr float kSpeechThreshold = 0.5;
constexpr size_t kMinSpeechDuration = 25;  // 250 ms
constexpr size_t kMinSilenceDuration = 10; // 100 ms
constexpr size_t kSpeechPad = 3            // 30 ms

} // namespace rnexecutorch::models::voice_activity_detection::constants