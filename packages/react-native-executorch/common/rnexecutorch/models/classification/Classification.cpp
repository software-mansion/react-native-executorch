#include "Classification.h"

#include <future>

#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/data_processing/Numerical.h>
#include <rnexecutorch/models/classification/Constants.h>

namespace rnexecutorch::models::classification {

Classification::Classification(const std::string &modelSource,
                               std::shared_ptr<react::CallInvoker> callInvoker)
    : VisionModel(modelSource, callInvoker) {
  auto inputShapes = getAllInputShapes();
  if (inputShapes.size() == 0) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "Model seems to not take any input tensors.");
  }
  std::vector<int32_t> modelInputShape = inputShapes[0];
  if (modelInputShape.size() < 2) {
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Unexpected model input size, expected at least 2 dimensions "
                  "but got: %zu.",
                  modelInputShape.size());
    throw RnExecutorchError(RnExecutorchErrorCode::WrongDimensions,
                            errorMessage);
  }
  modelImageSize = cv::Size(modelInputShape[modelInputShape.size() - 1],
                            modelInputShape[modelInputShape.size() - 2]);
}

std::unordered_map<std::string_view, float>
Classification::runInference(cv::Mat image) {
  std::scoped_lock lock(inference_mutex_);

  cv::Mat preprocessed = preprocessFrame(image);

  const std::vector<int32_t> tensorDims = getAllInputShapes()[0];
  auto inputTensor =
      image_processing::getTensorFromMatrix(tensorDims, preprocessed);

  auto forwardResult = BaseModel::forward(inputTensor);
  if (!forwardResult.ok()) {
    throw RnExecutorchError(forwardResult.error(),
                            "The model's forward function did not succeed. "
                            "Ensure the model input is correct.");
  }

  return postprocess(forwardResult->at(0).toTensor());
}

std::unordered_map<std::string_view, float>
Classification::generateFromString(std::string imageSource) {
  cv::Mat imageBGR = image_processing::readImage(imageSource);

  cv::Mat imageRGB;
  cv::cvtColor(imageBGR, imageRGB, cv::COLOR_BGR2RGB);

  return runInference(imageRGB);
}

std::unordered_map<std::string_view, float>
Classification::generateFromFrame(jsi::Runtime &runtime,
                                  const jsi::Value &frameData) {
  cv::Mat frame = extractFromFrame(runtime, frameData);
  return runInference(frame);
}

std::unordered_map<std::string_view, float>
Classification::generateFromPixels(JSTensorViewIn pixelData) {
  cv::Mat image = extractFromPixels(pixelData);

  return runInference(image);
}

std::unordered_map<std::string_view, float>
Classification::postprocess(const Tensor &tensor) {
  std::span<const float> resultData(
      static_cast<const float *>(tensor.const_data_ptr()), tensor.numel());
  std::vector<float> resultVec(resultData.begin(), resultData.end());

  if (resultVec.size() != constants::kImagenet1kV1Labels.size()) {
    char errorMessage[100];
    std::snprintf(
        errorMessage, sizeof(errorMessage),
        "Unexpected classification output size, was expecting: %zu classes "
        "but got: %zu classes",
        constants::kImagenet1kV1Labels.size(), resultVec.size());
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidModelOutput,
                            errorMessage);
  }

  numerical::softmax(resultVec);

  std::unordered_map<std::string_view, float> probs;
  for (std::size_t cl = 0; cl < resultVec.size(); ++cl) {
    probs[constants::kImagenet1kV1Labels[cl]] = resultVec[cl];
  }

  return probs;
}

} // namespace rnexecutorch::models::classification
