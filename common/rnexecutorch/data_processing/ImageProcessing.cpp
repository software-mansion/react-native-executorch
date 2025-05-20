#include "ImageProcessing.h"

#include <chrono>
#include <filesystem>

#include <ada/ada.h>

#include <rnexecutorch/Log.h>
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
std::vector<float> colorMatToVector(const cv::Mat &mat) {
  return colorMatToVector(mat, cv::Scalar(0.0, 0.0, 0.0),
                          cv::Scalar(1.0, 1.0, 1.0));
}

std::vector<float> colorMatToVector(const cv::Mat &mat, cv::Scalar mean,
                                    cv::Scalar variance) {
  int pixelCount = mat.cols * mat.rows;
  std::vector<float> v(pixelCount * 3);

  for (int i = 0; i < pixelCount; i++) {
    int row = i / mat.cols;
    int col = i % mat.cols;
    cv::Vec3b pixel = mat.at<cv::Vec3b>(row, col);
    v[0 * pixelCount + i] =
        (pixel[0] - mean[0] * 255.0) / (variance[0] * 255.0);
    v[1 * pixelCount + i] =
        (pixel[1] - mean[1] * 255.0) / (variance[1] * 255.0);
    v[2 * pixelCount + i] =
        (pixel[2] - mean[2] * 255.0) / (variance[2] * 255.0);
  }

  return v;
}

cv::Mat bufferToColorMat(const std::span<const float> &buffer,
                         cv::Size matSize) {
  cv::Mat mat(matSize, CV_8UC3);

  int pixelCount = matSize.width * matSize.height;
  for (int i = 0; i < pixelCount; i++) {
    int row = i / matSize.width;
    int col = i % matSize.width;

    float r = buffer[0 * pixelCount + i];
    float g = buffer[1 * pixelCount + i];
    float b = buffer[2 * pixelCount + i];

    cv::Vec3b color(static_cast<uchar>(b * 255), static_cast<uchar>(g * 255),
                    static_cast<uchar>(r * 255));
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

cv::Mat readImage(const std::string &imageURI) {
  cv::Mat image;

  if (imageURI.starts_with("data")) {
    // base64
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
    cv::Mat encodedData(1, data.size(), CV_8UC1, (void *)data.data());
    image = cv::imdecode(encodedData, cv::IMREAD_COLOR);
  } else if (imageURI.starts_with("file")) {
    // local file
    auto url = ada::parse(imageURI);
    image = cv::imread(std::string{url->get_pathname()}, cv::IMREAD_COLOR);
  } else {
    // remote file
    std::vector<std::byte> imageData = fetchUrlFunc(imageURI);
    image = cv::imdecode(
        cv::Mat(1, imageData.size(), CV_8UC1, (void *)imageData.data()),
        cv::IMREAD_COLOR);
  }

  if (image.empty()) {
    throw std::runtime_error("Read image error: invalid argument");
  }

  return image;
}

TensorPtr getTensorFromMatrix(const std::vector<int32_t> &sizes,
                              const cv::Mat &matrix) {
  std::vector<float> inputVector = colorMatToVector(matrix);
  return executorch::extension::make_tensor_ptr(sizes, inputVector);
}

cv::Mat getMatrixFromTensor(cv::Size size, const Tensor &tensor) {
  auto resultData = static_cast<const float *>(tensor.const_data_ptr());
  return bufferToColorMat(std::span<const float>(resultData, tensor.numel()),
                          size);
}
} // namespace imageprocessing
} // namespace rnexecutorch