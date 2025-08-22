#include "ObjectDetection.h"

#include <rnexecutorch/data_processing/ImageProcessing.h>

namespace rnexecutorch::models::object_detection {

ObjectDetection::ObjectDetection(
    const std::string &modelSource,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : BaseModel(modelSource, callInvoker) {
  auto inputTensors = getAllInputShapes();
  if (inputTensors.size() == 0) {
    throw std::runtime_error("Model seems to not take any input tensors.");
  }
  std::vector<int32_t> modelInputShape = inputTensors[0];
  if (modelInputShape.size() < 2) {
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Unexpected model input size, expected at least 2 dimentions "
                  "but got: %zu.",
                  modelInputShape.size());
    throw std::runtime_error(errorMessage);
  }
  modelImageSize = cv::Size(modelInputShape[modelInputShape.size() - 1],
                            modelInputShape[modelInputShape.size() - 2]);
}

std::vector<types::Detection>
ObjectDetection::postprocess(const std::vector<EValue> &tensors,
                             cv::Size originalSize, double detectionThreshold) {
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
    detections.emplace_back(x1, y1, x2, y2, static_cast<int>(labels[i]),
                            scores[i]);
  }

  std::vector<types::Detection> output = utils::nonMaxSuppression(detections);
  return output;
}

std::vector<types::Detection>
ObjectDetection::generate(std::string imageSource, double detectionThreshold) {
  auto [inputTensor, originalSize] =
      image_processing::readImageToTensor(imageSource, getAllInputShapes()[0]);

  auto forwardResult = BaseModel::forward(inputTensor);
  if (!forwardResult.ok()) {
    throw std::runtime_error(
        "Failed to forward, error: " +
        std::to_string(static_cast<uint32_t>(forwardResult.error())));
  }

  return postprocess(forwardResult.get(), originalSize, detectionThreshold);
}
} // namespace rnexecutorch::models::object_detection