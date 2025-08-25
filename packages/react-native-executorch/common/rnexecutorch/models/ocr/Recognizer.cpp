#include "Recognizer.h"
#include <numeric>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/data_processing/Numerical.h>
#include <rnexecutorch/models/ocr/Constants.h>
#include <rnexecutorch/models/ocr/Types.h>
#include <rnexecutorch/models/ocr/utils/RecognizerUtils.h>

namespace rnexecutorch::models::ocr {
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
  /*
   In our pipeline we use three types of Recognizer, each designated to
   handle different image sizes:
   - Small Recognizer - 128 x 64
   - Medium Recognizer - 256 x 64
   - Large Recognizer - 512 x 64
   The `generate` function as an argument accepts an image in grayscale
   already resized to the expected size.
  */
  std::vector<int32_t> tensorDims = getAllInputShapes()[0];
  TensorPtr inputTensor =
      image_processing::getTensorFromMatrixGray(tensorDims, grayImage);
  auto forwardResult = BaseModel::forward(inputTensor);
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Failed to forward in Recognizer, error: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }

  return postprocess(forwardResult->at(0).toTensor());
}

std::pair<std::vector<int32_t>, float>
Recognizer::postprocess(const Tensor &tensor) const {
  /*
   Raw model returns a tensor with dimensions [ 1 x seqLen x alphabetSize ]
  where:

    - seqLen is the length of predicted sequence. It is constant for the model.
   For our models it is:
     - 31 for Small Recognizer
     - 63 for Medium Recognizer
     - 127 for Large Recognizer
    Remember that usually many tokens of predicted sequences are blank, meaning
   the predicted text is not of const size.

    - alphabetSize is the length of considered alphabet. It is constant for the
   model. Usually depends on language, e.g. for our models for english it is 97,
   for polish it is 357 etc.

  Each value of returned tensor corresponds to character logits.
  */
  const int32_t alphabetSize = tensor.size(2);
  const int32_t numRows = tensor.numel() / alphabetSize;

  cv::Mat resultMat(numRows, alphabetSize, CV_32F,
                    tensor.mutable_data_ptr<float>());

  auto probabilities = utils::softmax(resultMat);
  auto [maxVal, maxIndices] = utils::findMaxValuesIndices(probabilities);
  float confidence = utils::confidenceScore(maxVal, maxIndices);
  return {maxIndices, confidence};
}
} // namespace rnexecutorch::models::ocr
