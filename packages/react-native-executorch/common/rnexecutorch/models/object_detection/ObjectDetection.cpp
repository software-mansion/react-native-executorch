#include "ObjectDetection.h"
#include "Constants.h"

#include <rnexecutorch/Error.h>
#include <rnexecutorch/ErrorCodes.h>
#include <rnexecutorch/Log.h>
#include <rnexecutorch/data_processing/ImageProcessing.h>
#include <rnexecutorch/host_objects/JsiConversions.h>
#include <rnexecutorch/utils/FrameProcessor.h>
#include <rnexecutorch/utils/FrameTransform.h>
#include <rnexecutorch/utils/TensorHelpers.h>
#include <rnexecutorch/utils/computer_vision/Processing.h>
#include <set>

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
  std::set<int32_t> allowedClasses(classIndices.begin(), classIndices.end());

  std::vector<types::Detection> detections;
  auto bboxes = utils::tensor::toSpan<float>(tensors.at(0));
  auto scores = utils::tensor::toSpan<float>(tensors.at(1));
  auto labels = utils::tensor::toSpan<float>(tensors.at(2));

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

  // Query and validate input shapes for the currently loaded method
  modelInputShape_ = validateAndGetInputShape(methodName, 2);

  cv::Mat preprocessed = preprocess(image);
  auto inputTensor = createInputTensor(preprocessed);

  auto outputs = executeOrThrow(methodName, {inputTensor},
                                "The model's " + methodName +
                                    " method did not succeed. "
                                    "Ensure the model input is correct.");

  return postprocess(outputs, originalSize, detectionThreshold, iouThreshold,
                     classIndices);
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
  auto [rotated, orient, _] = loadFrameRotated(runtime, frameData);
  auto detections = runInference(rotated, detectionThreshold, iouThreshold,
                                 classIndices, methodName);

  utils::inverseRotateBboxes(detections, orient, rotated.size());
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
