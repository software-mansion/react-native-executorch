#include "ObjectDetection.h"

#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>

namespace rnexecutorch::models::object_detection {

ObjectDetection::ObjectDetection(
    const std::string &modelSource,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : VisionModel(modelSource, callInvoker) {
  auto inputTensors = getAllInputShapes();
  if (inputTensors.size() == 0) {
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
  std::lock_guard<std::mutex> lock(inference_mutex_);

  auto [inputTensor, originalSize] =
      image_processing::readImageToTensor(imageSource, getAllInputShapes()[0]);

  auto forwardResult = BaseModel::forward(inputTensor);
  if (!forwardResult.ok()) {
    throw RnExecutorchError(forwardResult.error(),
                            "The model's forward function did not succeed. "
                            "Ensure the model input is correct.");
  }

  return postprocess(forwardResult.get(), originalSize, detectionThreshold);
}

std::vector<types::Detection>
ObjectDetection::generateFromFrame(jsi::Runtime &runtime,
                                   const jsi::Value &pixelData,
                                   double detectionThreshold) {
  // Try-lock: skip frame if model is busy (non-blocking for camera)
  if (!inference_mutex_.try_lock()) {
    return {}; // Return empty vector, don't block camera thread
  }
  std::lock_guard<std::mutex> lock(inference_mutex_, std::adopt_lock);

  // Get ArrayBuffer from JSI
  auto frameObj = pixelData.asObject(runtime);
  auto frameData = frameObj.getProperty(runtime, "data");
  int width =
      static_cast<int>(frameObj.getProperty(runtime, "width").asNumber());
  int height =
      static_cast<int>(frameObj.getProperty(runtime, "height").asNumber());

  auto arrayBuffer = frameData.asObject(runtime).getArrayBuffer(runtime);
  uint8_t *data = arrayBuffer.data(runtime);

  // Create cv::Mat from raw RGB data (no copy, just wraps the data)
  cv::Mat frameImage(height, width, CV_8UC3, data);
  cv::Size originalSize(width, height);

  // Preprocess frame (resize and color convert)
  cv::Mat preprocessed = preprocessFrame(frameImage);

  // Create tensor and run inference
  const std::vector<int32_t> tensorDims = getAllInputShapes()[0];
  auto inputTensor =
      image_processing::getTensorFromMatrix(tensorDims, preprocessed);

  auto forwardResult = BaseModel::forward(inputTensor);

  if (!forwardResult.ok()) {
    throw RnExecutorchError(forwardResult.error(),
                            "The model's forward function did not succeed. "
                            "Ensure the model input is correct.");
  }

  return postprocess(forwardResult.get(), originalSize, detectionThreshold);
}

cv::Mat ObjectDetection::preprocessFrame(const cv::Mat &frame) const {
  // Get target size from model input shape
  const std::vector<int32_t> tensorDims = getAllInputShapes()[0];
  cv::Size tensorSize = cv::Size(tensorDims[tensorDims.size() - 1],
                                 tensorDims[tensorDims.size() - 2]);

  // Resize and convert color
  cv::Mat processed;
  cv::resize(frame, processed, tensorSize);
  cv::cvtColor(processed, processed, cv::COLOR_BGR2RGB);

  return processed;
}
} // namespace rnexecutorch::models::object_detection
