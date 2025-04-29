#pragma once

#include <executorch/runtime/core/exec_aten/exec_aten.h>
#include <opencv2/opencv.hpp>
#include <span>
#include <string>
#include <vector>

namespace rnexecutorch::imageprocessing {
std::vector<float> colorMatToVector(const cv::Mat &mat, cv::Scalar mean,
                                    cv::Scalar variance);
std::vector<float> colorMatToVector(const cv::Mat &mat);
cv::Mat bufferToColorMat(const std::span<const float> &buffer,
                         cv::Size matSize);
std::string saveToTempFile(const cv::Mat &image);
cv::Mat readImage(const std::string &imageURI);
} // namespace rnexecutorch::imageprocessing