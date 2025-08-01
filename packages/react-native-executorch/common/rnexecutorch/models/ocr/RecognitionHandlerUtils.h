#pragma once

#include <opencv2/opencv.hpp>
#include <rnexecutorch/models/ocr/Types.h>

namespace rnexecutorch::ocr {
PaddingInfo calculateResizeRatioAndPaddings(cv::Size size,
                                            cv::Size desiredSize);
void computeRatioAndResize(cv::Mat &img, cv::Size size, int32_t modelHeight);
cv::Mat cropImage(DetectorBBox box, cv::Mat &image, int32_t modelHeight);
void adjustContrastGrey(cv::Mat &img, double target);
cv::Mat normalizeForRecognizer(cv::Mat &image, int32_t modelHeight,
                               double adjustContrast = 0,
                               bool isVertical = false);
} // namespace rnexecutorch::ocr
