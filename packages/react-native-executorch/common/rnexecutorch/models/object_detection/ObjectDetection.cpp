#include "ObjectDetection.h"
#include "Constants.h"

#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/utils/FrameProcessor.h>
#include <rnexecutorch/utils/FrameTransform.h>
#include <rnexecutorch/utils/computer_vision/Processing.h>

namespace rnexecutorch::models::object_detection {

ObjectDetection::ObjectDetection(
    const std::string &modelSource, std::vector<float> normMean,
    std::vector<float> normStd, std::vector<std::string> labelNames,
    std::shared_ptr<react::CallInvoker> callInvoker)
    : VisionModel(modelSource, callInvoker),
      labelNames_(std::move(labelNames)) {
  initNormalization(normMean, normStd);
}

cv::Size ObjectDetection::modelInputSize() const {
  if (currentlyLoadedMethod_.empty()) {
    return VisionModel::modelInputSize();
  }
  return getModelInputSize(currentlyLoadedMethod_);
}

std::vector<types::Detection>
ObjectDetection::postprocess(const std::vector<EValue> &tensors,
                             cv::Size originalSize, double detectionThreshold,
                             double iouThreshold,
                             const std::vector<int32_t> &classIndices) {
  const cv::Size inputSize = modelInputSize();
  float widthRatio = static_cast<float>(originalSize.width) / inputSize.width;
  float heightRatio =
      static_cast<float>(originalSize.height) / inputSize.height;

  // Prepare allowed classes set for filtering
  auto allowedClasses =
      utils::computer_vision::prepareAllowedClasses(classIndices);

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

    auto labelIdx = static_cast<int32_t>(labels[i]);

    // Filter by class if classesOfInterest is specified
    if (!allowedClasses.empty() &&
        allowedClasses.find(labelIdx) == allowedClasses.end()) {
      continue;
    }

    float x1 = bboxes[i * 4] * widthRatio;
    float y1 = bboxes[i * 4 + 1] * heightRatio;
    float x2 = bboxes[i * 4 + 2] * widthRatio;
    float y2 = bboxes[i * 4 + 3] * heightRatio;

    if (std::cmp_greater_equal(labelIdx, labelNames_.size())) {
      throw RnExecutorchError(
          RnExecutorchErrorCode::InvalidConfig,
          "Model output class index " + std::to_string(labelIdx) +
              " exceeds labelNames size " + std::to_string(labelNames_.size()) +
              ". Ensure the labelMap covers all model output classes.");
    }
    detections.emplace_back(utils::computer_vision::BBox{x1, y1, x2, y2},
                            labelNames_[labelIdx], labelIdx, scores[i]);
  }

  return utils::computer_vision::nonMaxSuppression(detections, iouThreshold);
}

std::vector<types::Detection> ObjectDetection::runInference(
    cv::Mat image, double detectionThreshold, double iouThreshold,
    const std::vector<int32_t> &classIndices, const std::string &methodName) {
  utils::computer_vision::validateThreshold(detectionThreshold,
                                            "detectionThreshold");
  utils::computer_vision::validateThreshold(iouThreshold, "iouThreshold");

  std::scoped_lock lock(inference_mutex_);

  // Ensure the correct method is loaded
  ensureMethodLoaded(methodName);

  cv::Size originalSize = image.size();

  // Query input shapes for the currently loaded method
  auto inputShapes = getAllInputShapes(methodName);
  if (inputShapes.empty() || inputShapes[0].size() < 2) {
    throw RnExecutorchError(RnExecutorchErrorCode::UnexpectedNumInputs,
                            "Could not determine input shape for method: " +
                                methodName);
  }
  modelInputShape_ = inputShapes[0];

  cv::Mat preprocessed = preprocess(image);
  auto inputTensor = createInputTensor(preprocessed);

  auto executeResult = execute(methodName, {inputTensor});
  if (!executeResult.ok()) {
    throw RnExecutorchError(executeResult.error(),
                            "The model's " + methodName +
                                " method did not succeed. "
                                "Ensure the model input is correct.");
  }

  return postprocess(executeResult.get(), originalSize, detectionThreshold,
                     iouThreshold, classIndices);
}

std::vector<types::Detection> ObjectDetection::generateFromString(
    std::string imageSource, double detectionThreshold, double iouThreshold,
    std::vector<int32_t> classIndices, std::string methodName) {
  cv::Mat imageRGB = loadImageToRGB(imageSource);
  return runInference(imageRGB, detectionThreshold, iouThreshold, classIndices,
                      methodName);
}

std::vector<types::Detection> ObjectDetection::generateFromFrame(
    jsi::Runtime &runtime, const jsi::Value &frameData,
    double detectionThreshold, double iouThreshold,
    std::vector<int32_t> classIndices, std::string methodName) {
  auto [rotated, orient] = loadFrameRotated(runtime, frameData);
  auto detections = runInference(rotated, detectionThreshold, iouThreshold,
                                 classIndices, methodName);

  for (auto &det : detections) {
    ::rnexecutorch::utils::inverseRotateBbox(det.bbox, orient, rotated.size());
  }
  return detections;
}

std::vector<types::Detection> ObjectDetection::generateFromPixels(
    JSTensorViewIn pixelData, double detectionThreshold, double iouThreshold,
    std::vector<int32_t> classIndices, std::string methodName) {
  cv::Mat image = extractFromPixels(pixelData);

  return runInference(image, detectionThreshold, iouThreshold, classIndices,
                      methodName);
}
} // namespace rnexecutorch::models::object_detection
