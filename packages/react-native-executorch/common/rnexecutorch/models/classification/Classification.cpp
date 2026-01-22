#include "Classification.h"

#include <future>
#include <iostream>

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
                  "Unexpected model input size, expected at least 2 dimentions "
                  "but got: %zu.",
                  modelInputShape.size());
    throw RnExecutorchError(RnExecutorchErrorCode::WrongDimensions,
                            errorMessage);
  }
  modelImageSize = cv::Size(modelInputShape[modelInputShape.size() - 1],
                            modelInputShape[modelInputShape.size() - 2]);
}

std::unordered_map<std::string_view, float>
Classification::generate(std::string imageSource) {
  // Lock and wait - JS API can afford to block
  std::lock_guard<std::mutex> lock(inference_mutex_);

  auto inputTensor =
      image_processing::readImageToTensor(imageSource, getAllInputShapes()[0])
          .first;
  auto forwardResult = BaseModel::forward(inputTensor);
  if (!forwardResult.ok()) {
    throw RnExecutorchError(forwardResult.error(),
                            "The model's forward function did not succeed. "
                            "Ensure the model input is correct.");
  }
  return postprocess(forwardResult->at(0).toTensor());
}

std::unordered_map<std::string_view, float> Classification::generateFromFrame(
    jsi::Runtime &runtime, const jsi::Value &pixelData, int width, int height) {
  // Try-lock: skip frame if model is busy (non-blocking for camera)
  if (!inference_mutex_.try_lock()) {
    return {}; // Return empty map, don't block camera thread
  }
  std::lock_guard<std::mutex> lock(inference_mutex_, std::adopt_lock);

  // Get ArrayBuffer from JSI
  auto arrayBuffer = pixelData.asObject(runtime).getArrayBuffer(runtime);
  uint8_t *data = arrayBuffer.data(runtime);
  size_t size = arrayBuffer.size(runtime);

  // Create cv::Mat from raw RGB data (no copy, just wraps the data)
  cv::Mat frameImage(height, width, CV_8UC3, data);

  // Preprocess frame (resize and color convert if needed)
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
  return postprocess(forwardResult->at(0).toTensor());
}

cv::Mat Classification::preprocessFrame(const cv::Mat &frame) const {
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
