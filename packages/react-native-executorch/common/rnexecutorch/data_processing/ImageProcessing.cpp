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
namespace image_processing {
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
  std::string filename = "rn_executorch_" + file_utils::getTimeID() + ".png";

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
  } else if (imageURI.starts_with("http")) {
    // remote file
    std::vector<std::byte> imageData = fetchUrlFunc(imageURI);
    image = cv::imdecode(
        cv::Mat(1, imageData.size(), CV_8UC1, (void *)imageData.data()),
        cv::IMREAD_COLOR);
  } else {
    throw std::runtime_error("Read image error: unknown protocol");
  }

  if (image.empty()) {
    throw std::runtime_error("Read image error: invalid argument");
  }

  return image;
}

TensorPtr getTensorFromMatrix(const std::vector<int32_t> &tensorDims,
                              const cv::Mat &matrix) {
  return executorch::extension::make_tensor_ptr(tensorDims,
                                                colorMatToVector(matrix));
}

TensorPtr getTensorFromMatrix(const std::vector<int32_t> &tensorDims,
                              const cv::Mat &matrix, cv::Scalar mean,
                              cv::Scalar variance) {
  return executorch::extension::make_tensor_ptr(
      tensorDims, colorMatToVector(matrix, mean, variance));
}

TensorPtr getTensorFromMatrixGray(const std::vector<int32_t> &tensorDims,
                                  const cv::Mat &matrix) {
  return executorch::extension::make_tensor_ptr(tensorDims,
                                                grayMatToVector(matrix));
}

std::vector<float> grayMatToVector(const cv::Mat &mat) {
  CV_Assert(mat.type() == CV_32F);
  if (mat.isContinuous()) {
    return {mat.ptr<float>(), mat.ptr<float>() + mat.total()};
  }

  std::vector<float> v;
  v.reserve(mat.total());
  for (int i = 0; i < mat.rows; ++i) {
    v.insert(v.end(), mat.ptr<float>(i), mat.ptr<float>(i) + mat.cols);
  }
  return v;
}

cv::Mat getMatrixFromTensor(cv::Size size, const Tensor &tensor) {
  auto resultData = static_cast<const float *>(tensor.const_data_ptr());
  return bufferToColorMat(std::span<const float>(resultData, tensor.numel()),
                          size);
}

cv::Mat resizePadded(const cv::Mat inputImage, cv::Size targetSize) {
  cv::Size inputSize = inputImage.size();
  const float heightRatio =
      static_cast<float>(targetSize.height) / inputSize.height;
  const float widthRatio =
      static_cast<float>(targetSize.width) / inputSize.width;
  const float resizeRatio = std::min(heightRatio, widthRatio);
  const int newWidth = inputSize.width * resizeRatio;
  const int newHeight = inputSize.height * resizeRatio;
  cv::Mat resizedImg;
  cv::resize(inputImage, resizedImg, cv::Size(newWidth, newHeight), 0, 0,
             cv::INTER_AREA);
  constexpr int minCornerPatchSize = 1;
  constexpr int cornerPatchFractionSize = 30;
  int cornerPatchSize =
      std::min(inputSize.height, inputSize.width) / cornerPatchFractionSize;
  cornerPatchSize = std::max(minCornerPatchSize, cornerPatchSize);

  const std::array<cv::Mat, 4> corners = {
      inputImage(cv::Rect(0, 0, cornerPatchSize, cornerPatchSize)),
      inputImage(cv::Rect(inputSize.width - cornerPatchSize, 0, cornerPatchSize,
                          cornerPatchSize)),
      inputImage(cv::Rect(0, inputSize.height - cornerPatchSize,
                          cornerPatchSize, cornerPatchSize)),
      inputImage(cv::Rect(inputSize.width - cornerPatchSize,
                          inputSize.height - cornerPatchSize, cornerPatchSize,
                          cornerPatchSize))};

  // We choose the color of the padding based on a mean of colors in the corners
  // of an image.
  cv::Scalar backgroundScalar = cv::mean(corners[0]);
#pragma unroll
  for (size_t i = 1; i < corners.size(); i++) {
    backgroundScalar += cv::mean(corners[i]);
  }
  backgroundScalar /= static_cast<double>(corners.size());

  constexpr size_t numChannels = 3;
#pragma unroll
  for (size_t i = 0; i < numChannels; ++i) {
    backgroundScalar[i] = cvFloor(backgroundScalar[i]);
  }

  const int deltaW = targetSize.width - newWidth;
  const int deltaH = targetSize.height - newHeight;
  const int top = deltaH / 2;
  const int bottom = deltaH - top;
  const int left = deltaW / 2;
  const int right = deltaW - left;

  cv::Mat centeredImg;
  cv::copyMakeBorder(resizedImg, centeredImg, top, bottom, left, right,
                     cv::BORDER_CONSTANT, backgroundScalar);

  return centeredImg;
}

std::pair<TensorPtr, cv::Size>
readImageToTensor(const std::string &path,
                  const std::vector<int32_t> &tensorDims,
                  bool maintainAspectRatio) {
  cv::Mat input = image_processing::readImage(path);
  cv::Size imageSize = input.size();

  if (tensorDims.size() < 2) {
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Unexpected tensor size, expected at least 2 dimentions "
                  "but got: %zu.",
                  tensorDims.size());
    throw std::runtime_error(errorMessage);
  }
  cv::Size tensorSize = cv::Size(tensorDims[tensorDims.size() - 1],
                                 tensorDims[tensorDims.size() - 2]);

  if (maintainAspectRatio) {
    input = resizePadded(input, tensorSize);
  } else {
    cv::resize(input, input, tensorSize);
  }

  cv::cvtColor(input, input, cv::COLOR_BGR2RGB);

  return {image_processing::getTensorFromMatrix(tensorDims, input), imageSize};
}
} // namespace image_processing
} // namespace rnexecutorch
