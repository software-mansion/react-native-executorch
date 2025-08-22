#pragma once

#include <cstdint>
#include <opencv2/opencv.hpp>

namespace rnexecutorch::models::ocr::constants {

inline constexpr float TEXT_THRESHOLD = 0.4;
inline constexpr float TEXT_THRESHOLD_VERTICAL = 0.3;
inline constexpr float LINK_THRESHOLD = 0.4;
inline constexpr float LOW_TEXT_THRESHOLD = 0.7;
inline constexpr float CENTER_THRESHOLD = 0.5;
inline constexpr float DISTANCE_THRESHOLD = 2.0;
inline constexpr float HEIGHT_THRESHOLD = 2.0;
inline constexpr float SINGLE_CHARACTER_CENTER_THRESHOLD = 0.3;
inline constexpr float LOW_CONFIDENCE_THRESHOLD = 0.3;
inline constexpr float ADJUST_CONTRAST = 0.2;
inline constexpr int32_t MIN_SIDE_THRESHOLD = 15;
inline constexpr int32_t MAX_SIDE_THRESHOLD = 30;
inline constexpr int32_t RECOGNIZER_HEIGHT = 64;
inline constexpr int32_t LARGE_RECOGNIZER_WIDTH = 512;
inline constexpr int32_t MEDIUM_RECOGNIZER_WIDTH = 256;
inline constexpr int32_t SMALL_RECOGNIZER_WIDTH = 128;
inline constexpr int32_t SMALL_VERTICAL_RECOGNIZER_WIDTH = 64;
inline constexpr int32_t MAX_WIDTH =
    LARGE_RECOGNIZER_WIDTH + (LARGE_RECOGNIZER_WIDTH * 0.15);
inline constexpr int32_t SINGLE_CHARACTER_MIN_SIZE = 70;
inline constexpr int32_t RECOGNIZER_IMAGE_SIZE = 1280;
inline constexpr int32_t VERTICAL_LINE_THRESHOLD = 20;

inline const cv::Scalar MEAN(0.485, 0.456, 0.406);
inline const cv::Scalar VARIANCE(0.229, 0.224, 0.225);

} // namespace rnexecutorch::models::ocr::constants
