#include "ImageProcessing.h"
#include <filesystem>

#include <ada/ada.h>

#include <rnexecutorch/RnExecutorchInstaller.h>
#include <rnexecutorch/data_processing/FileUtils.h>
#include <rnexecutorch/data_processing/base64.h>

namespace rnexecutorch {

// This is defined in RnExecutorchInstaller.cpp. This function fetches data
// from a url address. It is implemented in Kotlin/ObjectiveC++ and then bound
// to this variable. It's done to not handle SSL intricacies manually, as it is
// done automagically in ObjC++/Kotlin.
extern FetchUrlFunc_t fetchUrlFunc;
namespace imageprocessing {

std::vector<float> convertColorMatToVector(const cv::Mat &mat) {
  return convertColorMatToVector(mat, cv::Scalar(0.0, 0.0, 0.0),
                                 cv::Scalar(1.0, 1.0, 1.0));
}

std::vector<float> convertColorMatToVector(const cv::Mat &mat, cv::Scalar mean,
                                           cv::Scalar variance) {
  constexpr size_t numChannels = 3;
  constexpr auto maxPixelValueFloat = 255.0F;

  int pixelCount = mat.cols * mat.rows;
  std::vector<float> v(pixelCount * numChannels, 0.0F);

// rescale to pixels values in matrix
#pragma unroll
  for (size_t i = 0; i < numChannels; ++i) {
    mean[i] *= maxPixelValueFloat;
    variance[i] *= maxPixelValueFloat;
  }

  for (int i = 0; i < pixelCount; ++i) {
    int row = i / mat.cols;
    int col = i % mat.cols;
    cv::Vec3b pixel = mat.at<cv::Vec3b>(row, col);
#pragma unroll
    for (int j = 0; j < numChannels; ++j) {
      v[j * pixelCount + i] = (pixel[j] - mean[j]) / variance[j];
    }
  }

  return v;
}

cv::Mat covertBufferToColorMat(std::span<const float> buffer,
                               cv::Size matSize) {
  cv::Mat mat(matSize, CV_8UC3);
  constexpr auto maxPixelValueFloat = 255.0F;

  int pixelCount = matSize.width * matSize.height;
  for (int i = 0; i < pixelCount; ++i) {
    int row = i / matSize.width;
    int col = i % matSize.width;

    float r = buffer[0 * pixelCount + i];
    float g = buffer[1 * pixelCount + i];
    float b = buffer[2 * pixelCount + i];

    cv::Vec3b color(static_cast<uchar>(b * maxPixelValueFloat),
                    static_cast<uchar>(g * maxPixelValueFloat),
                    static_cast<uchar>(r * maxPixelValueFloat));
    mat.at<cv::Vec3b>(row, col) = color;
  }

  return mat;
}

std::string saveToTempFile(const cv::Mat &image) {
  std::string filename = "rn_executorch_" + fileutils::getTimeID() + ".png";

  std::filesystem::path tempDir = std::filesystem::temp_directory_path();
  std::filesystem::path filePath = tempDir / filename;

  if (!cv::imwrite(filePath.string(), image)) {
    throw std::runtime_error("Failed to save the image: " + filePath.string());
  }

  return "file://" + filePath.string();
}

cv::Mat readImageToMatrix(const std::string &imageURI) {
  cv::Mat image;

  if (imageURI.starts_with("data")) {
    image = details::handleBase64Data(imageURI);
  } else if (imageURI.starts_with("file")) {
    image = details::handleLocalFile(imageURI);
  } else if (imageURI.starts_with("http")) {
    image = details::handleRemoteFile(imageURI);
  } else {
    throw std::runtime_error("Read image error: unknown protocol");
  }

  if (image.empty()) {
    throw std::runtime_error("Read image error: invalid argument");
  }

  return image;
}

cv::Mat convertTensorToMatrix(cv::Size size, const Tensor &tensor) {
  const auto *resultData = tensor.const_data_ptr<float>();
  return convertBufferToColorMat(
      std::span<const float>(resultData, tensor.numel()), size);
}

TensorPtr covertMatrixToTensor(const std::vector<int32_t> &tensorDims,
                               cv::Mat &input) {

  cv::Size tensorSize = details::getTensorSize(tensorDims);
  cv::resize(input, input, tensorSize);
  cv::cvtColor(input, input, cv::COLOR_BGR2RGB);

  return details::covertMatrixToTensorRaw(tensorDims, input);
}

namespace details {

static cv::Mat handleBase64Data(const std::string &imageURI) {
  std::stringstream uriStream(imageURI);
  std::string stringData;
  std::size_t segmentIndex{0};
  while (std::getline(uriStream, stringData, ',')) {
    ++segmentIndex;
  }
  if (segmentIndex != 1) {
    throw std::runtime_error("Read image error: invalid base64 URI");
  }
  auto data = base64_decode(stringData);
  cv::Mat encodedData(1, data.size(), CV_8UC1,
                      static_cast<void *>(data.data()));
  return cv::imdecode(encodedData, cv::IMREAD_COLOR);
}

static cv::Mat handleLocalFile(const std::string &imageURI) {
  auto url = ada::parse(imageURI);
  return cv::imread(std::string{url->get_pathname()}, cv::IMREAD_COLOR);
}

static cv::Mat handleRemoteFile(const std::string &imageURI) {
  std::vector<std::byte> imageData = fetchUrlFunc(imageURI);
  return cv::imdecode(cv::Mat(1, imageData.size(), CV_8UC1,
                              static_cast<void *>(imageData.data())),
                      cv::IMREAD_COLOR);
}

static cv::Size getTensorSize(const std::vector<int32_t> &tensorDims) {
  if (tensorDims.size() < 2) {
    throw std::runtime_error(
        "Unexpected tensor size, expected at least 2 dimentions but got: " +
        std::to_string(tensorDims.size()));
  }

  return {tensorDims[tensorDims.size() - 1], tensorDims[tensorDims.size() - 2]};
}

static TensorPtr covertMatrixToTensorRaw(const std::vector<int32_t> &tensorDims,
                                         const cv::Mat &matrix) {
  std::vector<float> inputVector = convertColorMatToVector(matrix);
  return executorch::extension::make_tensor_ptr(tensorDims, inputVector);
}

} // namespace details

} // namespace imageprocessing

} // namespace rnexecutorch
