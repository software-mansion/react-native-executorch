#include "Recognizer.h"
#include <numeric>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/data_processing/Numerical.h>
#include <rnexecutorch/models/ocr/Constants.h>
#include <rnexecutorch/models/ocr/RecognizerUtils.h>
namespace rnexecutorch {

Recognizer::Recognizer(const std::string &modelSource,
                       std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  auto inputShapes = getAllInputShapes();
  if (inputShapes.size() == 0) {
    throw std::runtime_error(
        "Detector model seems to not take any input tensors.");
  }
  std::vector<int32_t> modelInputShape = inputShapes[0];
  if (modelInputShape.size() < 2) {
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Unexpected detector model input size, expected at least 2 "
                  "dimentions but got: %zu.",
                  modelInputShape.size());
    throw std::runtime_error(errorMessage);
  }
  modelImageSize = cv::Size(modelInputShape[modelInputShape.size() - 1],
                            modelInputShape[modelInputShape.size() - 2]);
}

std::pair<std::vector<int32_t>, float> Recognizer::generate(cv::Mat greyImage) {
  std::vector<int32_t> tensorDims = {1, greyImage.rows, greyImage.cols};
  TensorPtr inputTensor =
      imageprocessing::getTensorFromMatrix(tensorDims, greyImage);
  // auto [inputTensor, originalSize] =
  //    imageprocessing::readImageToTensor(imageSource, getAllInputShapes()[0],
  //    true, true);
  //  log(LOG_LEVEL::Info, "Image Source", imageSource, "original size: ",
  //  originalSize);
  auto forwardResult = BaseModel::forward(inputTensor);
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Failed to forward, error: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }

  return postprocess(forwardResult->at(0).toTensor()); //, originalSize);
}

std::pair<std::vector<int32_t>, float>
Recognizer::postprocess(const Tensor &tensor) {
  // std::vector<int32_t> modelOutputShape = BaseModel::getOutputShape(0);
  // if (modelOutputShape.size() < 2) {
  //   char errorMessage[100];
  //   std::snprintf(errorMessage, sizeof(errorMessage),
  //                 "Unexpected detector model input size, expected at least 2
  //                 " "dimentions but got: %zu.", modelOutputShape.size());
  //   throw std::runtime_error(errorMessage);
  // }
  // auto modelOutputSize = cv::Size(modelOutputShape[modelOutputShape.size() -
  // 2],
  //                                 modelOutputShape[modelOutputShape.size() -
  //                                 1]);  //not sure what order should be lol
  // int32_t numElements = tensor.size(0);
  // std::vector<int32_t> vec = {static_cast<int32_t>(tensor.size(1)),
  // static_cast<int32_t>(tensor.size(2)), static_cast<int32_t>(numElements),
  // modelOutputSize.height, modelOutputSize.width,
  // static_cast<int32_t>(modelOutputShape.size())};
  // copy data from Tensor to cv::Mat
  log(LOG_LEVEL::Debug, "SIZES: ", tensor.sizes());
  std::span<const float> tensorData(
      static_cast<const float *>(tensor.const_data_ptr()), tensor.numel());
  cv::Size size(tensor.size(1), tensor.size(2));
  log(LOG_LEVEL::Debug, "dataSIZE: ", tensorData.size());

  cv::Mat mat = cv::Mat(size.width, size.height, CV_32F);

  for (std::size_t i = 0; i < tensorData.size(); i++) {
    const float value = tensorData[i];
    const int x = i % size.height;
    const int y = i / size.height;
    mat.at<float>(y, x) = value;
  }
  // log(LOG_LEVEL::Debug, "BEFORE SOFTMAX: ", mat);
  ocr::softmax(mat);
  log(LOG_LEVEL::Debug, "AFTER SOFTMAX: ", mat);
  auto [maxVal, maxIndices] = ocr::findMaxValuesIndices(mat);
  float confidence = ocr::confidenceScore(maxVal, maxIndices);
  log(LOG_LEVEL::Debug, "val size: ", maxVal.size());
  log(LOG_LEVEL::Debug, "ind size: ", maxIndices.size());

  return {maxIndices, confidence};
}
} // namespace rnexecutorch