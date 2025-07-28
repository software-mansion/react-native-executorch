#include "Recognizer.h"
#include <numeric>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/data_processing/Numerical.h>
#include <rnexecutorch/models/ocr/Constants.h>
#include <rnexecutorch/models/ocr/RecognizerUtils.h>
#include <vector>

namespace rnexecutorch {
Recognizer::Recognizer(const std::string &modelSource,
                       std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  auto inputShapes = getAllInputShapes();
  if (inputShapes.empty()) {
    throw std::runtime_error("Recognizer model has no input tensors.");
  }
  std::vector<int32_t> modelInputShape = inputShapes[0];
  if (modelInputShape.size() < 2) {
    throw std::runtime_error("Unexpected Recognizer model input shape.");
  }
  modelImageSize = cv::Size(modelInputShape[modelInputShape.size() - 1],
                            modelInputShape[modelInputShape.size() - 2]);
}

std::pair<std::vector<int32_t>, float>
Recognizer::generate(const cv::Mat &grayImage) {
  std::vector<int32_t> tensorDims = getAllInputShapes()[0];
  TensorPtr inputTensor =
      imageprocessing::getTensorFromMatrixGray(tensorDims, grayImage);
  auto forwardResult = BaseModel::forward(inputTensor);
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Failed to forward in Recognizer, error: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }

  return postprocess(forwardResult->at(0).toTensor());
}

std::pair<std::vector<int32_t>, float>
Recognizer::postprocess(const Tensor &tensor) {
  const int numClasses = tensor.size(2);
  const int numRows = tensor.numel() / numClasses;
  cv::Mat resultMat(numRows, numClasses, CV_32F,
                    const_cast<float *>(tensor.const_data_ptr<float>()));
  auto probabilities = ocr::softmax(resultMat);
  auto [maxVal, maxIndices] = ocr::findMaxValuesIndices(probabilities);

  float confidence = ocr::confidenceScore(maxVal, maxIndices);
  return {maxIndices, confidence};
}
} // namespace rnexecutorch
