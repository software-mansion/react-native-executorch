#include "ObjectDetection.h"

#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>

namespace rnexecutorch::models::object_detection {

ObjectDetection::ObjectDetection(
    const std::string &modelSource,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  auto inputTensors = getAllInputShapes();
  if (inputTensors.empty()) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "Model seems to not take any input tensors.");
  }
  std::vector<int32_t> modelInputShape = inputTensors[0];
  if (modelInputShape.size() < 2) {
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Unexpected model input size, expected at least 2 dimentions "
                  "but got: %zu.",
                  modelInputShape.size());
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            errorMessage);
  }
  modelImageSize = cv::Size(modelInputShape[modelInputShape.size() - 1],
                            modelInputShape[modelInputShape.size() - 2]);
}

ObjectDetection::ObjectDetection(
    const std::string &modelSource, std::vector<float> normMean,
    std::vector<float> normStd, std::shared_ptr<react::CallInvoker> callInvoker)
    : ObjectDetection(modelSource, callInvoker) {
  if (normMean.size() >= 3) {
    normMean_ = cv::Scalar(normMean[0], normMean[1], normMean[2]);
  }
  if (normStd.size() >= 3) {
    normStd_ = cv::Scalar(normStd[0], normStd[1], normStd[2]);
  }
}

std::vector<types::Detection>
ObjectDetection::postprocess(const std::vector<EValue> &tensors,
                             cv::Size originalSize, double detectionThreshold,
                             const std::vector<std::string> &labelNames) {
  if (detectionThreshold <= 0 || detectionThreshold > 1) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidConfig,
                            "Detection threshold must be greater than 0 "
                            "and less than or equal to 1.");
  }
  float widthRatio =
      static_cast<float>(originalSize.width) / modelImageSize.width;
  float heightRatio =
      static_cast<float>(originalSize.height) / modelImageSize.height;

  std::vector<types::Detection> detections;
  auto bboxTensor = tensors.at(0).toTensor();
  std::span<const float> bboxes(
      static_cast<const float *>(bboxTensor.const_data_ptr()),
      bboxTensor.numel());

  auto scoreTensor = tensors.at(1).toTensor();
  std::span<const float> scores(
      static_cast<const float *>(scoreTensor.const_data_ptr()),
      scoreTensor.numel());

  auto labelTensor = tensors.at(2).toTensor();
  std::span<const float> labels(
      static_cast<const float *>(labelTensor.const_data_ptr()),
      labelTensor.numel());

  for (std::size_t i = 0; i < scores.size(); ++i) {
    if (scores[i] < detectionThreshold) {
      continue;
    }
    float x1 = bboxes[i * 4] * widthRatio;
    float y1 = bboxes[i * 4 + 1] * heightRatio;
    float x2 = bboxes[i * 4 + 2] * widthRatio;
    float y2 = bboxes[i * 4 + 3] * heightRatio;
    auto labelIdx = static_cast<std::size_t>(labels[i]);
    std::string labelName =
        labelIdx < labelNames.size() ? labelNames[labelIdx] : "";
    detections.emplace_back(x1, y1, x2, y2, labelName, scores[i]);
  }

  std::vector<types::Detection> output = utils::nonMaxSuppression(detections);
  return output;
}

std::vector<types::Detection>
ObjectDetection::generate(std::string imageSource, double detectionThreshold,
                          std::vector<std::string> labelNames) {
  auto [inputTensor, originalSize] = image_processing::readImageToTensor(
      imageSource, getAllInputShapes()[0], false, normMean_, normStd_);

  auto forwardResult = BaseModel::forward(inputTensor);
  if (!forwardResult.ok()) {
    throw RnExecutorchError(forwardResult.error(),
                            "The model's forward function did not succeed. "
                            "Ensure the model input is correct.");
  }

  return postprocess(forwardResult.get(), originalSize, detectionThreshold,
                     labelNames);
}
} // namespace rnexecutorch::models::object_detection
