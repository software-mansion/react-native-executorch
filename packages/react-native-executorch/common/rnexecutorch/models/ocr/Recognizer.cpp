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
  if (inputShapes.size() == 0) {
    throw std::runtime_error("Recognizer model has no input tensors.");
  }
  std::vector<int32_t> modelInputShape = inputShapes[0];
  if (modelInputShape.size() < 2) {
    throw std::runtime_error("Unexpected Recognizer model input shape.");
  }
  modelImageSize = cv::Size(modelInputShape[modelInputShape.size() - 1],
                            modelInputShape[modelInputShape.size() - 2]);
}

std::pair<std::vector<int32_t>, float> Recognizer::generate(cv::Mat greyImage) {
  std::vector<int32_t> tensorDims = {1, 1, greyImage.rows, greyImage.cols};
  TensorPtr inputTensor =
      imageprocessing::getTensorFromMatrixGray(tensorDims, greyImage);
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
  cv::Mat probabilities = ocr::softmax(resultMat);
  std::vector<float> predsNorm = ocr::sumProbabilityRows(probabilities);
  ocr::divideMatrixByRows(probabilities, predsNorm);
  auto [maxVal, maxIndices] = ocr::findMaxValuesIndices(probabilities);

  float confidence = ocr::confidenceScore(maxVal, maxIndices);
  return {maxIndices, confidence};
}
} // namespace rnexecutorch
