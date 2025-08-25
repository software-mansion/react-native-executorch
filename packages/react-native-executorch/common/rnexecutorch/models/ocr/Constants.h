#pragma once

#include <cstdint>
#include <opencv2/opencv.hpp>

namespace rnexecutorch::models::ocr::constants {

inline constexpr float kTextThreshold = 0.4;
inline constexpr float kTextThresholdVertical = 0.3;
inline constexpr float kLinkThreshold = 0.4;
inline constexpr float kLowTextThreshold = 0.7;
inline constexpr float kCenterThreshold = 0.5;
inline constexpr float kDistanceThreshold = 2.0;
inline constexpr float kHeightThreshold = 2.0;
inline constexpr float kSingleCharacterCenterThreshold = 0.3;
inline constexpr float kLowConfidenceThreshold = 0.3;
inline constexpr float kAdjustContrast = 0.2;
inline constexpr int32_t kMinSideThreshold = 15;
inline constexpr int32_t kMaxSideThreshold = 30;
inline constexpr int32_t kRecognizerHeight = 64;
inline constexpr int32_t kLargeRecognizerWidth = 512;
inline constexpr int32_t kMediumRecognizerWidth = 256;
inline constexpr int32_t kSmallRecognizerWidth = 128;
inline constexpr int32_t kSmallVerticalRecognizerWidth = 64;
inline constexpr int32_t kMaxWidth =
    kLargeRecognizerWidth + (kLargeRecognizerWidth * 0.15);
inline constexpr int32_t kSingleCharacterMinSize = 70;
inline constexpr int32_t kRecognizerImageSize = 1280;
inline constexpr int32_t kVerticalLineThreshold = 20;

inline const cv::Scalar kMean(0.485, 0.456, 0.406);
inline const cv::Scalar kVariance(0.229, 0.224, 0.225);

} // namespace rnexecutorch::models::ocr::constants
