#include "ObjectDetection.h"

#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/utils/FrameProcessor.h>

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

cv::Mat ObjectDetection::preprocessFrame(const cv::Mat &frame) const {
  // Get target size from model input shape
  const std::vector<int32_t> tensorDims = getAllInputShapes()[0];
  cv::Size tensorSize = cv::Size(tensorDims[tensorDims.size() - 1],
                                 tensorDims[tensorDims.size() - 2]);

  cv::Mat rgb;

  // Convert RGBA/BGRA to RGB if needed (for VisionCamera frames)
  if (frame.channels() == 4) {
// Platform-specific color conversion:
// iOS uses BGRA format, Android uses RGBA format
#ifdef __APPLE__
    // iOS: BGRA → RGB
    cv::cvtColor(frame, rgb, cv::COLOR_BGRA2RGB);
#else
    // Android: RGBA → RGB
    cv::cvtColor(frame, rgb, cv::COLOR_RGBA2RGB);
#endif
  } else if (frame.channels() == 3) {
    // Already RGB
    rgb = frame;
  } else {
    char errorMessage[100];
    std::snprintf(errorMessage, sizeof(errorMessage),
                  "Unsupported frame format: %d channels", frame.channels());
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            errorMessage);
  }

  // Only resize if dimensions don't match
  if (rgb.size() != tensorSize) {
    cv::Mat resized;
    cv::resize(rgb, resized, tensorSize);
    return resized;
  }

  return rgb;
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

  return utils::nonMaxSuppression(detections);
}

std::vector<types::Detection>
ObjectDetection::runInference(cv::Mat image, double detectionThreshold) {
  std::lock_guard<std::mutex> lock(inference_mutex_);

  // Store original size for postprocessing
  cv::Size originalSize = image.size();

  // Preprocess the image using model-specific preprocessing
  cv::Mat preprocessed = preprocessFrame(image);

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

std::vector<types::Detection>
ObjectDetection::generateFromString(std::string imageSource,
                                    double detectionThreshold) {
  // Read image using OpenCV (BGR format)
  cv::Mat image = image_processing::readImage(imageSource);

  // Convert BGR to RGB (OpenCV imread returns BGR)
  cv::Mat imageRGB;
  cv::cvtColor(image, imageRGB, cv::COLOR_BGR2RGB);

  // Use the internal helper - it handles locking, preprocessing, and inference
  return runInference(imageRGB, detectionThreshold);
}

std::vector<types::Detection>
ObjectDetection::generateFromFrame(jsi::Runtime &runtime,
                                   const jsi::Value &frameData,
                                   double detectionThreshold) {
  // Try-lock: skip frame if model is busy (non-blocking for camera)
  if (!inference_mutex_.try_lock()) {
    return {}; // Return empty vector, don't block camera thread
  }

  // Extract frame (under lock to ensure thread safety)
  cv::Mat frame;
  {
    std::lock_guard<std::mutex> lock(inference_mutex_, std::adopt_lock);
    auto frameObj = frameData.asObject(runtime);
    frame =
        rnexecutorch::utils::FrameProcessor::extractFrame(runtime, frameObj);
  }
  // Lock is automatically released here when going out of scope

  // Use the internal helper - it handles locking, preprocessing, and inference
  return runInference(frame, detectionThreshold);
}

std::vector<types::Detection>
ObjectDetection::generateFromPixels(jsi::Runtime &runtime,
                                    const jsi::Value &pixelData,
                                    double detectionThreshold) {
  // Convert JSI value to JSTensorViewIn
  auto tensorView =
      jsi_conversion::getValue<JSTensorViewIn>(pixelData, runtime);

  // Extract raw pixel data to cv::Mat
  cv::Mat image = extractFromPixels(tensorView);

  // Use the internal helper - it handles locking, preprocessing, and inference
  return runInference(image, detectionThreshold);
}
} // namespace rnexecutorch::models::object_detection