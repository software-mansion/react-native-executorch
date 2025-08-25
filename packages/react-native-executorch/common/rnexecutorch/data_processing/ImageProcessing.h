#pragma once

#include <executorch/extension/tensor/tensor.h>
#include <executorch/extension/tensor/tensor_ptr.h>
#include <opencv2/opencv.hpp>
#include <optional>
#include <span>
#include <string>
#include <vector>

namespace rnexecutorch::image_processing {
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
/// @brief Read image in a BGR format to a cv::Mat
cv::Mat readImage(const std::string &imageURI);
TensorPtr getTensorFromMatrix(const std::vector<int32_t> &tensorDims,
                              const cv::Mat &mat);
TensorPtr getTensorFromMatrix(const std::vector<int32_t> &tensorDims,
                              const cv::Mat &matrix, cv::Scalar mean,
                              cv::Scalar variance);
cv::Mat getMatrixFromTensor(cv::Size size, const Tensor &tensor);
TensorPtr getTensorFromMatrixGray(const std::vector<int32_t> &tensorDims,
                                  const cv::Mat &matrix);
std::vector<float> grayMatToVector(const cv::Mat &mat);
/**
 * @brief Resizes an image to fit within target dimensions while preserving
 * aspect ratio, adding padding if needed. Padding color is derived from the
 * image's corner pixels for seamless blending.
 */
cv::Mat resizePadded(const cv::Mat inputImage, cv::Size targetSize);
/// @brief Read image, resize it and copy it to an ET tensor to store it.
/// @param path Path to the image to be resized. Could be base64, local file or
/// remote URL
/// @param tensorDims The dimensions of the result tensor. The two last
/// dimensions are taken as the image resolution.
/// @param maintainAspectRatio If set to true the image will be resized to
/// maintain the original aspect ratio. The rest of the tensor will be filled
/// padding.
/// @return Returns a tensor pointer and the original size of the image.
std::pair<TensorPtr, cv::Size>
readImageToTensor(const std::string &path,
                  const std::vector<int32_t> &tensorDims,
                  bool maintainAspectRatio = false);
} // namespace rnexecutorch::image_processing
