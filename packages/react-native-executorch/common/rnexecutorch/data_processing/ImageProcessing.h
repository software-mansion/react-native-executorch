#pragma once

#include <span>
#include <string>
#include <vector>

#include <executorch/extension/tensor/tensor.h>
#include <executorch/extension/tensor/tensor_ptr.h>

#include <opencv2/opencv.hpp>

namespace rnexecutorch::imageprocessing {
using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

/// @brief Convert an OpenCV matrix to channel-first vector representation
std::vector<float> convertColorMatToVector(const cv::Mat &mat, cv::Scalar mean,
                                           cv::Scalar variance);

/// @brief Convert an OpenCV matrix to channel-first vector representation
std::vector<float> covertColorMatToVector(const cv::Mat &mat);

/// @brief Convert a channel-first representation of an RGB image to OpenCV
/// matrix
cv::Mat covertBufferToColorMat(const std::span<const float> &buffer,
                               cv::Size matSize);

/// @brief Save image passed as matrix to temporary file and return URI
std::string saveToTempFile(const cv::Mat &image);

/// @brief Read image in a BGR format to a cv::Mat
cv::Mat readImageToMatrix(const std::string &imageURI);

/// @brief Create an OpenCV matrix based on a tensor content
cv::Mat convertTensorToMatrix(cv::Size size, const Tensor &tensor);

/// @brief Create a tensor based on an OpenCV matrix content. Please mind that
/// for performance reasons matrix is passed by mutable reference
TensorPtr covertMatrixToTensor(const std::vector<int32_t> &tensorDims,
                               cv::Mat &input);

} // namespace rnexecutorch::imageprocessing