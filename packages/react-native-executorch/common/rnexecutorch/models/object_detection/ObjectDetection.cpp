#include "ObjectDetection.h"

#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/utils/FrameProcessor.h>

namespace rnexecutorch::models::object_detection {

ObjectDetection::ObjectDetection(
    const std::string &modelSource, std::vector<float> normMean,
    std::vector<float> normStd, std::vector<std::string> labelNames,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : VisionModel(modelSource, callInvoker),
      labelNames_(std::move(labelNames)) {
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
  if (normMean.size() == 3) {
    normMean_ = cv::Scalar(normMean[0], normMean[1], normMean[2]);
  } else if (!normMean.empty()) {
    log(LOG_LEVEL::Warn,
        "normMean must have 3 elements — ignoring provided value.");
  }
  if (normStd.size() == 3) {
    normStd_ = cv::Scalar(normStd[0], normStd[1], normStd[2]);
  } else if (!normStd.empty()) {
    log(LOG_LEVEL::Warn,
        "normStd must have 3 elements — ignoring provided value.");
  }
}

cv::Mat ObjectDetection::preprocessFrame(const cv::Mat &frame) const {
  const std::vector<int32_t> tensorDims = getAllInputShapes()[0];
  cv::Size tensorSize = cv::Size(tensorDims[tensorDims.size() - 1],
                                 tensorDims[tensorDims.size() - 2]);

  cv::Mat rgb;

  if (frame.channels() == 4) {
#ifdef __APPLE__
    cv::cvtColor(frame, rgb, cv::COLOR_BGRA2RGB);
#else
    cv::cvtColor(frame, rgb, cv::COLOR_RGBA2RGB);
#endif
  } else if (frame.channels() == 3) {
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
    auto labelIdx = static_cast<std::size_t>(labels[i]);
    if (labelIdx >= labelNames_.size()) {
      throw RnExecutorchError(
          RnExecutorchErrorCode::InvalidConfig,
          "Model output class index " + std::to_string(labelIdx) +
              " exceeds labelNames size " + std::to_string(labelNames_.size()) +
              ". Ensure the labelMap covers all model output classes.");
    }
    detections.emplace_back(x1, y1, x2, y2, labelNames_[labelIdx], scores[i]);
  }

  return utils::nonMaxSuppression(detections);
}

std::vector<types::Detection>
ObjectDetection::runInference(cv::Mat image, double detectionThreshold) {
  if (detectionThreshold < 0.0 || detectionThreshold > 1.0) {
    throw RnExecutorchError(RnExecutorchErrorCode::InvalidUserInput,
                            "detectionThreshold must be in range [0, 1]");
  }
  std::scoped_lock lock(inference_mutex_);

  cv::Size originalSize = image.size();
  cv::Mat preprocessed = preprocessFrame(image);

  const std::vector<int32_t> tensorDims = getAllInputShapes()[0];
  auto inputTensor =
      (normMean_ && normStd_)
          ? image_processing::getTensorFromMatrix(tensorDims, preprocessed,
                                                  *normMean_, *normStd_)
          : image_processing::getTensorFromMatrix(tensorDims, preprocessed);

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
  cv::Mat imageBGR = image_processing::readImage(imageSource);

  cv::Mat imageRGB;
  cv::cvtColor(imageBGR, imageRGB, cv::COLOR_BGR2RGB);

  return runInference(imageRGB, detectionThreshold);
}

std::vector<types::Detection>
ObjectDetection::generateFromFrame(jsi::Runtime &runtime,
                                   const jsi::Value &frameData,
                                   double detectionThreshold) {
  auto frameObj = frameData.asObject(runtime);
  cv::Mat frame = rnexecutorch::utils::extractFrame(runtime, frameObj);

  return runInference(frame, detectionThreshold);
}

std::vector<types::Detection>
ObjectDetection::generateFromPixels(JSTensorViewIn pixelData,
                                    double detectionThreshold) {
  cv::Mat image = extractFromPixels(pixelData);

  return runInference(image, detectionThreshold);
}
} // namespace rnexecutorch::models::object_detection
