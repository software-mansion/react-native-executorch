#pragma once

#include <executorch/extension/tensor/tensor.h>
#include <executorch/extension/tensor/tensor_ptr.h>
#include <opencv2/opencv.hpp>
#include <span>
#include <string>
#include <vector>

namespace rnexecutorch::image_processing {
using executorch::aten::Tensor;
using executorch::extension::TensorPtr;

/// @brief Save image passed as matrix to temporary file and return URI
std::string saveToTempFile(const cv::Mat &image);

TensorPtr getTensorFromMatrix(const std::vector<int32_t> &tensorDims,
                              const cv::Mat &mat);
TensorPtr getTensorFromMatrix(const std::vector<int32_t> &tensorDims,
                              const cv::Mat &matrix, cv::Scalar mean,
                              cv::Scalar variance);
TensorPtr getTensorFromMatrixGray(const std::vector<int32_t> &tensorDims,
                                  const cv::Mat &matrix);
/**
 * @brief Resizes an image to fit within target dimensions while preserving
 * aspect ratio, adding padding if needed. Padding color is derived from the
 * image's corner pixels for seamless blending.
 */
cv::Mat resizePadded(const cv::Mat inputImage, cv::Size targetSize);

/// @brief Create an OpenCV matrix based on an image URI
cv::Mat readImageToMatrix(const std::string &imageURI);

/// @brief Create an OpenCV matrix based on a tensor content
cv::Mat convertTensorToMatrix(cv::Size size, const Tensor &tensor);

/// @brief Create a tensor based on an OpenCV matrix content. Please mind that
/// for performance reasons matrix is passed by mutable reference
TensorPtr covertMatrixToTensor(const std::vector<int32_t> &tensorDims,
                               cv::Mat &input);

} // namespace rnexecutorch::image_processing
