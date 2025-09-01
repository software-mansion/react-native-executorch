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
namespace fs = std::filesystem;

static std::vector<float> convertColorMatToVector(const cv::Mat &mat,
                                                  cv::Scalar mean,
                                                  cv::Scalar variance) {
  constexpr size_t kNumChannels = 3;
  constexpr auto kMaxPixelValueFloat = 255.0F;

  int pixelCount = mat.cols * mat.rows;
  std::vector<float> v(pixelCount * kNumChannels, 0.0F);

// rescale to pixels values in matrix
#pragma unroll
  for (size_t i = 0; i < kNumChannels; ++i) {
    mean[i] *= kMaxPixelValueFloat;
    variance[i] *= kMaxPixelValueFloat;
  }

  for (int i = 0; i < pixelCount; ++i) {
    int row = i / mat.cols;
    int col = i % mat.cols;
    cv::Vec3b pixel = mat.at<cv::Vec3b>(row, col);
#pragma unroll
    for (size_t j = 0; j < kNumChannels; ++j) {
      v.at(j * pixelCount + i) = (pixel[j] - mean[j]) / variance[j];
    }
  }

  return v;
}

static std::vector<float> convertColorMatToVector(const cv::Mat &mat) {
  return convertColorMatToVector(mat, cv::Scalar(0.0, 0.0, 0.0),
                                 cv::Scalar(1.0, 1.0, 1.0));
}

static cv::Mat convertBufferToColorMat(std::span<const float> buffer,
                                       cv::Size matSize) {
  cv::Mat mat(matSize, CV_8UC3);
  constexpr auto kMaxPixelValueFloat = 255.0F;

  int pixelCount = matSize.width * matSize.height;
  for (int i = 0; i < pixelCount; ++i) {
    const int row = i / matSize.width;
    const int col = i % matSize.width;

    const float r = buffer[0 * pixelCount + i];
    const float g = buffer[1 * pixelCount + i];
    const float b = buffer[2 * pixelCount + i];

    cv::Vec3b color(static_cast<uchar>(b * kMaxPixelValueFloat),
                    static_cast<uchar>(g * kMaxPixelValueFloat),
                    static_cast<uchar>(r * kMaxPixelValueFloat));
    mat.at<cv::Vec3b>(row, col) = color;
  }

  return mat;
}

std::string saveToTempFile(const cv::Mat &image) {
  std::string filename = "rn_executorch_" + file_utils::getTimeID() + ".png";

  fs::path tempDir = fs::temp_directory_path();
  fs::path filePath = tempDir / filename;

  if (!cv::imwrite(filePath.string(), image)) {
    throw std::runtime_error("Failed to save the image: " + filePath.string());
  }

  return "file://" + filePath.string();
}

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

cv::Mat readImageToMatrix(const std::string &imageURI) {
  cv::Mat image;

  if (imageURI.starts_with("data")) {
    image = handleBase64Data(imageURI);
  } else if (imageURI.starts_with("file")) {
    image = handleLocalFile(imageURI);
  } else if (imageURI.starts_with("http")) {
    image = handleRemoteFile(imageURI);
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
  return executorch::extension::make_tensor_ptr(
      tensorDims, convertColorMatToVector(matrix));
}

TensorPtr getTensorFromMatrix(const std::vector<int32_t> &tensorDims,
                              const cv::Mat &matrix, cv::Scalar mean,
                              cv::Scalar variance) {
  return executorch::extension::make_tensor_ptr(
      tensorDims, convertColorMatToVector(matrix, mean, variance));
}

static std::vector<float> grayMatToVector(const cv::Mat &mat) {
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

TensorPtr getTensorFromMatrixGray(const std::vector<int32_t> &tensorDims,
                                  const cv::Mat &matrix) {
  return executorch::extension::make_tensor_ptr(tensorDims,
                                                grayMatToVector(matrix));
}

cv::Mat convertTensorToMatrix(cv::Size size, const Tensor &tensor) {
  const auto *resultData = tensor.const_data_ptr<float>();
  return convertBufferToColorMat(
      std::span<const float>(resultData, tensor.numel()), size);
}

cv::Size getSizeOfImageFromTensorDims(const std::vector<int32_t> &tensorDims) {
  if (tensorDims.size() < 2) {
    throw std::runtime_error(
        "Unexpected tensor size, expected at least 2 dimentions but got: " +
        std::to_string(tensorDims.size()));
  }

  return {tensorDims[tensorDims.size() - 1], tensorDims[tensorDims.size() - 2]};
}

void adaptImageForTensor(const std::vector<int32_t> &tensorDims,
                         cv::Mat &input) {
  cv::Size tensorSize = getSizeOfImageFromTensorDims(tensorDims);
  cv::resize(input, input, tensorSize);
  cv::cvtColor(input, input, cv::COLOR_BGR2RGB);
}

static cv::Scalar
computeBackgroundScalar(const std::array<cv::Mat, 4> &corners) {
  // We choose the color of the padding based on a mean of colors in the
  // corners of an image.
  cv::Scalar backgroundScalar = cv::mean(corners[0]);
#pragma unroll
  for (size_t i = 1; i < corners.size(); i++) {
    backgroundScalar += cv::mean(corners[i]);
  }
  backgroundScalar /= static_cast<double>(corners.size());

  constexpr size_t kNumChannels = 3;
#pragma unroll
  for (size_t i = 0; i < kNumChannels; ++i) {
    backgroundScalar[i] = cvFloor(backgroundScalar[i]);
  }
  return backgroundScalar;
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
  constexpr int kMinCornerPatchSize = 1;
  constexpr int kCornerPatchFractionSize = 30;
  int cornerPatchSize =
      std::min(inputSize.height, inputSize.width) / kCornerPatchFractionSize;
  cornerPatchSize = std::max(kMinCornerPatchSize, cornerPatchSize);

  const std::array<cv::Mat, 4> corners = {
      inputImage(cv::Rect(0, 0, cornerPatchSize, cornerPatchSize)),
      inputImage(cv::Rect(inputSize.width - cornerPatchSize, 0, cornerPatchSize,
                          cornerPatchSize)),
      inputImage(cv::Rect(0, inputSize.height - cornerPatchSize,
                          cornerPatchSize, cornerPatchSize)),
      inputImage(cv::Rect(inputSize.width - cornerPatchSize,
                          inputSize.height - cornerPatchSize, cornerPatchSize,
                          cornerPatchSize))};

  cv::Scalar backgroundScalar = computeBackgroundScalar(corners);

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
} // namespace image_processing
} // namespace rnexecutorch
