#pragma once

#include <cstdint>
#include <opencv2/opencv.hpp>

namespace rnexecutorch::ocr {

inline constexpr float textThreshold = 0.4;
inline constexpr float textThresholdVertical = 0.3;
inline constexpr float linkThreshold = 0.4;
inline constexpr float lowTextThreshold = 0.7;
inline constexpr float centerThreshold = 0.5;
inline constexpr float distanceThreshold = 2.0;
inline constexpr float heightThreshold = 2.0;
inline constexpr float restoreRatio = 3.2;
inline constexpr float restoreRatioVertical = 2.0;
inline constexpr float singleCharacterCenterThreshold = 0.3;
inline constexpr float lowConfidenceThreshold = 0.3;
inline constexpr float adjustContrast = 0.2;
inline constexpr int32_t minSideThreshold = 15;
inline constexpr int32_t maxSideThreshold = 30;
inline constexpr int32_t recognizerHeight = 64;
inline constexpr int32_t largeRecognizerWidth = 512;
inline constexpr int32_t mediumRecognizerWidth = 256;
inline constexpr int32_t smallRecognizerWidth = 128;
inline constexpr int32_t smallVerticalRecognizerWidth = 64;
inline constexpr int32_t maxWidth =
    largeRecognizerWidth + (largeRecognizerWidth * 0.15);
inline constexpr int32_t minSize = 20;
inline constexpr int32_t singleCharacterMinSize = 70;
inline constexpr int32_t recognizerImageSize = 1280;
inline constexpr int32_t verticalLineThreshold = 20;

inline const cv::Scalar mean(0.485, 0.456, 0.406);
inline const cv::Scalar variance(0.229, 0.224, 0.225);

} // namespace rnexecutorch::ocr