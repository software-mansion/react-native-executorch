#include "Recognizer.h"
#include "Constants.h"
#include <numeric>
#include <rnexecutorch/Error.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/data_processing/Numerical.h>
#include <rnexecutorch/models/ocr/Constants.h>
#include <rnexecutorch/models/ocr/Types.h>
#include <rnexecutorch/models/ocr/utils/DetectorUtils.h>
#include <rnexecutorch/models/ocr/utils/RecognizerUtils.h>
#include <string>

namespace rnexecutorch::models::ocr {
Recognizer::Recognizer(const std::string &modelSource,
                       std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {}

std::pair<std::vector<int32_t>, float>
Recognizer::generate(const cv::Mat &grayImage, int32_t inputWidth) {
  /*
   In our pipeline we use three types of Recognizer, each designated to
   handle different image sizes:
   - Small Recognizer - 128 x 64
   - Medium Recognizer - 256 x 64
   - Large Recognizer - 512 x 64
   The `generate` function as an argument accepts an image in grayscale
   already resized to the expected size.
  */
  utils::validateInputWidth(inputWidth, constants::kRecognizerInputWidths,
                            "Recognizer");

  std::string method_name = "forward_" + std::to_string(inputWidth);
  auto shapes = getAllInputShapes(method_name);
  if (shapes.empty()) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "OCR method takes no inputs: " + method_name);
  }
  std::vector<int32_t> tensorDims = shapes[0];
  TensorPtr inputTensor =
      image_processing::getTensorFromMatrixGray(tensorDims, grayImage);
  auto forwardResult = BaseModel::execute(method_name, {inputTensor});
  if (!forwardResult.ok()) {
    throw RnExecutorchError(forwardResult.error(),
                            "The model's forward function did not succeed. "
                            "Ensure the model input is correct.");
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
