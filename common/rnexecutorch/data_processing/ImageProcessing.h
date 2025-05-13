#pragma once

#include <executorch/extension/tensor/tensor.h>
#include <executorch/extension/tensor/tensor_ptr.h>
#include <opencv2/opencv.hpp>
#include <span>
#include <string>
#include <vector>

namespace rnexecutorch::imageprocessing {
using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

/// @brief Convert a OpenCV matrix to channel-first vector representation
std::vector<float> colorMatToVector(const cv::Mat &mat, cv::Scalar mean,
                                    cv::Scalar variance);
/// @brief Convert a OpenCV matrix to channel-first vector representation
std::vector<float> colorMatToVector(const cv::Mat &mat);
/// @brief Convert a channel-first representation of an RGB image to OpenCV
/// matrix
cv::Mat bufferToColorMat(const std::span<const float> &buffer,
                         cv::Size matSize);
std::string saveToTempFile(const cv::Mat &image);
cv::Mat readImage(const std::string &imageURI);
TensorPtr getTensorFromMatrix(const std::vector<int32_t> &sizes,
                              const cv::Mat &mat);
cv::Mat getMatrixFromTensor(cv::Size size, const Tensor &tensor);

} // namespace rnexecutorch::imageprocessing